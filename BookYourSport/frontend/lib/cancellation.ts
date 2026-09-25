export function getCancellationMessage(
    reason?: string | null
): string | null {
    switch (reason) {
        case "CourtDeactivated":
            return "Klub je deaktivirao ovaj teren, pa je tvoja rezervacija otkazana. Uplaćeni iznos ti je u celosti vraćen na račun.";

        case "CourtRemoved":
            return "Klub je uklonio ovaj teren, pa je tvoja rezervacija otkazana. Uplaćeni iznos ti je u celosti vraćen na račun.";

        default:
            return null;
    }
}