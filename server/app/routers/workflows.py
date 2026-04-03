from fastapi import APIRouter
import json, os, uuid
from pathlib import Path

router = APIRouter()

WORKFLOWS_DIR = Path("./workflows")
WORKFLOWS_DIR.mkdir(exist_ok=True)

@router.get("/workflows")
def list_workflows():
    workflows = []
    for f in WORKFLOWS_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text())
            workflows.append({"id": f.stem, "name": data.get("name", f.stem)})
        except Exception:
            pass
    return workflows

@router.post("/workflows")
def save_workflow(workflow: dict):
    wid = workflow.get("id") or str(uuid.uuid4())
    workflow["id"] = wid
    (WORKFLOWS_DIR / f"{wid}.json").write_text(json.dumps(workflow, indent=2))
    return {"id": wid}

@router.get("/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    path = WORKFLOWS_DIR / f"{workflow_id}.json"
    if not path.exists():
        return {"error": "not found"}, 404
    return json.loads(path.read_text())
