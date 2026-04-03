from abc import ABC, abstractmethod
from typing import Any, Callable, Awaitable, Optional

# Callback type for progress events from executors
# (event_type: str, data: dict) -> None
ProgressCallback = Optional[Callable[[str, dict[str, Any]], Awaitable[None]]]

class BaseExecutor(ABC):
    @abstractmethod
    async def execute(
        self,
        node_type: str,
        params: dict[str, Any],
        inputs: dict[str, Any],
        on_progress: ProgressCallback = None,
    ) -> dict[str, Any]:
        """Execute a node and return its output socket values."""
        ...
