declare module 'react-big-calendar' {
	import * as React from 'react';
	export interface CalendarProps<TEvent = object, TResource = object> {
		localizer: any;
		events: TEvent[];
		startAccessor: string | ((event: TEvent) => Date);
		endAccessor: string | ((event: TEvent) => Date);
		eventPropGetter?: (event: TEvent) => object;
		onSelectEvent?: (event: TEvent) => void;
		selectable?: boolean;
		onSelectSlot?: (slotInfo: object) => void;
		views?: string[];
		messages?: object;
		culture?: string;
		onEventResize?: (data: any) => void;
		onEventDrop?: (data: any) => void;
		resizable?: boolean;
		draggableAccessor?: (event: object) => boolean;
		// ...other props
	}
	export class Calendar<TEvent = object, TResource = object> extends React.Component<CalendarProps<TEvent, TResource>> {}
	export function dateFnsLocalizer(config: any): any;
}
declare module 'react-big-calendar/lib/addons/dragAndDrop' {
	import { Calendar } from 'react-big-calendar';
	export default function withDragAndDrop<TEvent = object, TResource = object>(calendar: typeof Calendar): typeof Calendar;
}
