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
 * Internal state and controllers.
 */
export interface Internals {
    instanceId: string;
    sid: string | null;
    eventEmitter: any; // Ideally import { EventEmitter } from '@supercat1337/event-emitter'
}

/**
 * Interface for DOM references annotation.
 */
export type RefsAnnotation = Record<string, any>;