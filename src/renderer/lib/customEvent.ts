

export interface MyCustomEventMap {
  'widget-preview': CustomEvent<{ widgetId?: string | null }>;
}
export const customEvent = {
  addEventListener<K extends keyof MyCustomEventMap>(
    type: K,
    listener: (ev: MyCustomEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    window.addEventListener(type, listener as EventListener, options);
  },
  removeEventListener<K extends keyof MyCustomEventMap>(
    type: K,
    listener: (ev: MyCustomEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ) {
    window.removeEventListener(type, listener as EventListener, options);
  },
  dispatchEvent<K extends keyof MyCustomEventMap>(type: K, payload: MyCustomEventMap[K]['detail']) {
    const customEvent = new CustomEvent(type, { detail: payload });
    return window.dispatchEvent(customEvent);
  }
}