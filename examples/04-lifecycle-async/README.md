## Async Data Fetching with Auto-Cancellation

This example demonstrates how to safely perform asynchronous operations (like API calls) inside a component, ensuring they are automatically cancelled when the component is unmounted. It uses the built-in `disconnectController.signal` to abort fetch requests, preventing memory leaks and state updates on unmounted components.

**Key concepts:**
- Using `disconnectController.signal` in `fetch`
- Handling loading, success, and error states with refs
- Dynamic addition/removal of child components in a slot
- Parent-child communication via callbacks