# WorkPal

WorkPal is a mobile-first business travel companion. Open `index.html` in a modern browser; the phone-width layout is the primary experience.

## Included trips

The trip selector includes prefilled San Francisco, Seattle, and New York itineraries with flight, hotel, meeting, ground-transport, and meal details. These records are fictional examples, not connected reservations. Choose a trip to view its schedule and manage its travel information.

## Main interactions

- Follow a trip through preparation, outbound travel, on-site days, and the return journey.
- Manage flight and rental details, checklist items, meeting buffers, and ground-travel preferences.
- Open **Ask Pal** for voice input, typed requests, and shortcuts to trip details. Voice recognition and spoken replies depend on browser support and permissions.
- Review the trip status and route options with the companion. Route changes can be edited, accepted, and undone.
- Add, edit, and remove meal expenses. Attach a receipt from the photo library or take a picture with the camera.
- Open **Route map** or **Start navigation** to follow a route using browser location and device heading. The external map handoff opens Google Maps.
- Use **Reset this trip** in Updates to restore the selected itinerary.

## Data and connectivity

Trip records are stored in browser storage on this device. Airline, hotel, meeting, fare, and travel-time details come from the included trip records; WorkPal is not connected to airline, calendar, transit, hotel, or messaging accounts. Companion alerts and route comparisons are generated from local rules. They do not send messages or book services.

Directions require location permission and internet access. While navigation is active, coordinates are sent to the public OSRM routing service and map tiles load from OpenStreetMap; availability and accuracy are not guaranteed. Live traffic and incident information are not available in WorkPal. Use the Google Maps handoff for current turn-by-turn guidance. Receipt photos are compressed and stored locally; they are not uploaded. Voice options vary by device.
