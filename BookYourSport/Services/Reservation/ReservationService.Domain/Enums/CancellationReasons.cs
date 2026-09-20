namespace ReservationService.Domain.Enums;

public static class CancellationReasons
{
    // Vlasnik kluba je deaktivirao teren.
    public const string CourtDeactivated = "CourtDeactivated";

    // Vlasnik kluba je obrisao teren.
    public const string CourtRemoved = "CourtRemoved";
}