"""
Heartbeat that syncs ComfyUI workflows across all workers.

Every SYNC_INTERVAL seconds it:
  1. Queries each online worker's /api/userdata?dir=workflows API
  2. Builds a union of all known workflows across all workers
  3. Pushes any missing workflow to every worker that doesn't have it
  4. Also uploads new workflows to the NAS via SFTP (skeletor) for backup

NAS canonical path: /mnt/pool_01/comfyui/ComfyUI/user/default/workflows/
"""

import asyncio
import logging
import os
import json

import httpx
import paramiko

logger = logging.getLogger("aiui.workflow_sync")

SYNC_INTERVAL   = 60          # seconds between sweeps
SKELETOR_HOST   = "skeletor"
SKELETOR_USER   = "admin"
SKELETOR_PASS   = os.getenv("SKELETOR_PASSWORD", "3Illiams3Illiams!")
NAS_WORKFLOWS   = "/mnt/pool_01/comfyui/ComfyUI/user/default/workflows"
WORKERS_URL     = "http://skeletor:8080/workers.json"


def _sftp_existing(sftp) -> set[str]:
    """Return the set of filenames already on the NAS."""
    try:
        return {f.filename for f in sftp.listdir_attr(NAS_WORKFLOWS)}
    except Exception:
        return set()


def _upload_to_nas(sftp, name: str, content: bytes):
    dest = f"{NAS_WORKFLOWS}/{name}"
    with sftp.open(dest, "wb") as f:
        f.write(content)
    logger.info(f"[workflow_sync] uploaded → {name}")


async def _get_online_workers() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(WORKERS_URL)
            if res.status_code == 200:
                return [w for w in res.json().get("workers", []) if w.get("status") == "online" and w.get("direct")]
    except Exception as e:
        logger.warning(f"[workflow_sync] workers.json fetch failed: {e}")
    return []


async def _list_worker_workflows(direct_url: str) -> list[dict]:
    """Return list of {path, size, modified} from a worker's userdata API."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(
                f"{direct_url}/api/userdata",
                params={"dir": "workflows", "recurse": "true", "split": "false", "full_info": "true"},
            )
            if res.status_code == 200:
                return [f for f in res.json() if f.get("path", "").endswith(".json")]
    except Exception as e:
        logger.debug(f"[workflow_sync] list failed {direct_url}: {e}")
    return []


async def _fetch_workflow(direct_url: str, path: str) -> bytes | None:
    encoded = path.replace("/", "%2F")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{direct_url}/api/userdata/workflows%2F{encoded}")
            if res.status_code == 200:
                return res.content
    except Exception as e:
        logger.debug(f"[workflow_sync] fetch failed {path}: {e}")
    return None


async def _push_workflow_to_worker(direct_url: str, filename: str, content: bytes):
    """Push a workflow file to a worker via userdata POST API."""
    from urllib.parse import quote
    path = quote(f"workflows/{filename}", safe="")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{direct_url}/api/userdata/{path}",
                content=content,
                headers={"Content-Type": "application/json"},
            )
            if res.status_code == 200:
                logger.info(f"[workflow_sync] pushed {filename} → {direct_url}")
                return True
    except Exception as e:
        logger.debug(f"[workflow_sync] push failed {filename} → {direct_url}: {e}")
    return False


async def sync_once():
    workers = await _get_online_workers()
    if not workers:
        return

    # ── Phase 1: collect all workflows from all workers ──
    # Map filename → (content, source_worker_url)
    all_workflows: dict[str, tuple[bytes, str]] = {}
    worker_files: dict[str, set[str]] = {}  # direct_url → set of filenames

    for worker in workers:
        direct = worker["direct"]
        files = await _list_worker_workflows(direct)
        worker_files[direct] = set()

        for f in files:
            filename = f["path"]
            if filename == "cache_bust.json":
                continue
            worker_files[direct].add(filename)
            if filename not in all_workflows:
                content = await _fetch_workflow(direct, filename)
                if content:
                    all_workflows[filename] = (content, direct)

    if not all_workflows:
        return

    # ── Phase 2: push missing workflows to each worker ──
    push_count = 0
    for worker in workers:
        direct = worker["direct"]
        have = worker_files.get(direct, set())
        for filename, (content, _) in all_workflows.items():
            if filename not in have:
                ok = await _push_workflow_to_worker(direct, filename, content)
                if ok:
                    push_count += 1

    if push_count:
        logger.info(f"[workflow_sync] propagated {push_count} workflow(s) to workers")

    # ── Phase 3: backup new workflows to NAS via SFTP ──
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SKELETOR_HOST, username=SKELETOR_USER, password=SKELETOR_PASS, timeout=5)
        sftp = ssh.open_sftp()
        try:
            existing = _sftp_existing(sftp)
            nas_count = 0
            for filename, (content, _) in all_workflows.items():
                if filename not in existing:
                    try:
                        _upload_to_nas(sftp, filename, content)
                        nas_count += 1
                    except Exception as e:
                        logger.warning(f"[workflow_sync] NAS upload failed {filename}: {e}")
            if nas_count:
                logger.info(f"[workflow_sync] backed up {nas_count} workflow(s) to NAS")
        finally:
            sftp.close()
            ssh.close()
    except Exception as e:
        logger.warning(f"[workflow_sync] SSH connect failed: {e}")


async def heartbeat():
    """Background loop — runs forever, syncs every SYNC_INTERVAL seconds."""
    logger.info(f"[workflow_sync] heartbeat started (interval={SYNC_INTERVAL}s)")
    while True:
        try:
            await sync_once()
        except Exception as e:
            logger.warning(f"[workflow_sync] sync error: {e}")
        await asyncio.sleep(SYNC_INTERVAL)
