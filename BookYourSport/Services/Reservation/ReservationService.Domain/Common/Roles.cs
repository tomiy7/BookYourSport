namespace ReservationService.Domain.Common;

public class Roles
{
    public const string Admin = "admin";
    public const string Club = "club";
    public const string Player = "player";
    
    public const string PlayerOrAdmin = Admin + "," + Player;
    public const string ClubOrAdmin = Admin + "," + Club;
    public const string PlayerClubOrAdmin = Admin + "," + Club + "," + Player;
}