/**
 * Valid lifecycle events for the Component class.
 */
export type ComponentLifecycleEvent = 
    | "connect" 
    | "disconnect" 
    | "mount" 
    | "unmount" 
    | "prepareRender" 
    | "collapse" 
    | "expand" 
    | "restore";

/**
 * Represents a component event name. 
 * Includes standard lifecycle events and allows custom string events with IDE autocomplete support.
 */
export type ComponentEvent = ComponentLifecycleEvent | (string & {});

/**
 * Strategy for inserting teleported content.
 */
export type TeleportStrategy = "append" | "prepend" | "replace";

/**
 * Configuration for a teleported fragment.
 */
export interface TeleportConfig {
    /** A function that returns a markup fragment for teleportation. */
    layout: () => DocumentFragment;
    /** A target element, selector, or function that returns an element. */
    target: Element | string | (() => Element | null);
    /** Insertion strategy (default is "append"). */
    strategy?: TeleportStrategy;
}

/**
 * A map of teleport names to their configurations.
 */
export type TeleportList = Record<string, TeleportConfig>;

/**
 * Serialized component data used for SSR and hydration.
 */
export interface ComponentMetadata {
    /** The constructor name for class instantiation. */
    className: string;
    /** Serialized state from component.serialize(). */
    data: any;
    /** Map of slot names to arrays of child instance IDs. */
    slots: Record<string, string[]>;
}

/**
 * Function responsible for updating text nodes within the component.
 */
export type TextUpdateFunction = (component: any) => void;

/**
 * Options for the Component constructor.
 */
export interface ComponentOptions {
    instanceId?: string;
    sid?: string;
    [key: string]: any; // Allow for custom state initialization
}

/**
 * Interface for DOM references annotation.
 */
export type RefsAnnotation = Record<string, any>;

/**
 * Options for DOM scanning utilities (like selectRefsExtended or walkDomScope).
 */
export interface DomScopeOptions {
    /** Attributes that define a new naming scope (e.g., ['data-slot', 'data-component-root']). */
    scopeAttribute: string[];
    /** Attribute used for reference tracking (e.g., 'data-ref'). */
    refAttribute: string;
    /** The window object (for Node.js/JSDOM compatibility). */
    window: any;
}

/**
 * Callbacks used during the recursive SID update and hydration process.
 */
export interface HydrationCallbacks {
    /** Called to set the SID on a component instance. */
    onUpdateSid: (component: any, sid: string) => void;
    /** Called to trigger the hydration logic (restore state, etc.) for a component. */
    onApplyHydration: (component: any) => void;
    /** Called to retrieve the map of slots from a component instance. */
    getSlots: (component: any) => Map<string, any>;
}

/**
 * The structure returned after scanning a DOM tree for references.
 */
export interface RefScanResult {
    /** Map of elements marked with data-ref. */
    refs: Record<string, HTMLElement>;
    /** Map of elements that act as slot containers or sub-scopes. */
    scopeRefs: Record<string, HTMLElement>;
}