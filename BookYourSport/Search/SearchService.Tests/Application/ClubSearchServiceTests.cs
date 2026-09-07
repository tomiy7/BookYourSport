using Moq;
using SearchService.Application.DTOs;
using SearchService.Application.Interfaces;
using SearchService.Application.Services;
using SearchService.Domain.Enums;
using SearchService.Tests.Application.TestData;
using Xunit;

namespace SearchService.Tests.Application;

public class ClubSearchServiceTests
{
    private readonly Mock<IReservationServiceClient> _reservationClientMock;
    private readonly Mock<IGeocodingService> _geocodingServiceMock;
    private readonly ClubSearchService _service;

    public ClubSearchServiceTests()
    {
        _reservationClientMock = new Mock<IReservationServiceClient>();
        _geocodingServiceMock = new Mock<IGeocodingService>();

        _service = new ClubSearchService(
            _reservationClientMock.Object,
            _geocodingServiceMock.Object);
    }
    [Fact]
    public async Task SearchClubsAsync_WithUserCoordinates_CalculatesDistance()
    {
        // Arrange
        var club = new ReservationClubDto
        {
            Id = Guid.NewGuid(),
            Name = "Teniski klub Zvezdara",
            IsActive = true,
            Address = new ReservationAddressDto
            {
                Country = "Serbia",
                City = "Beograd",
                Street = "Gajeva",
                StreetNumber = "10"
            },
            Courts = new List<ReservationCourtDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Teren 1",
                IsActive = true,
                SurfaceType = SurfaceType.Carpet,
                IsIndoor = false,
                PricePerHour = new ReservationPriceDto
                {
                    Amount = 1500,
                    Currency = "RSD"
                }
            }
        }
        };

        _reservationClientMock
            .Setup(x => x.GetClubsAsync())
            .ReturnsAsync(new List<ReservationClubDto>
            {
            club
            });

        _geocodingServiceMock
            .Setup(x => x.GeocodeAsync(It.IsAny<string>()))
            .ReturnsAsync(new GeoLocationDto
            {
                Latitude = 44.7993846,
                Longitude = 20.4871742
            });

        var request = new SearchClubsRequestDto
        {
            Latitude = 44.815,
            Longitude = 20.487,
            SortBy = "distance"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);

        Assert.NotNull(result.Clubs[0].DistanceKm);
        Assert.True(result.Clubs[0].DistanceKm > 0);

        Assert.Equal(44.7993846, result.Clubs[0].Latitude);
        Assert.Equal(20.4871742, result.Clubs[0].Longitude);
    }

    private void SetupClubs(params ReservationClubDto[] clubs)
    {
        _reservationClientMock
            .Setup(x => x.GetClubsAsync())
            .ReturnsAsync(clubs.ToList());
    }

    [Fact]
    public async Task SearchClubsAsync_FiltersByName()
    {
        // Arrange
        var zvezdara = ClubTestData.CreateClub("Teniski klub Zvezdara");
        var partizan = ClubTestData.CreateClub("Teniski klub Partizan");

        SetupClubs(zvezdara, partizan);

        var request = new SearchClubsRequestDto
        {
            Name = "zvezdara"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Teniski klub Zvezdara", result.Clubs[0].Name);
    }


    [Fact]
    public async Task SearchClubsAsync_FiltersByCity()
    {
        // Arrange
        var belgradeClub = ClubTestData.CreateClub(
            "Klub Beograd",
            city: "Beograd");

        var noviSadClub = ClubTestData.CreateClub(
            "Klub Novi Sad",
            city: "Novi Sad");

        SetupClubs(belgradeClub, noviSadClub);

        var request = new SearchClubsRequestDto
        {
            City = "novi sad"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Klub Novi Sad", result.Clubs[0].Name);
    }


    [Fact]
    public async Task SearchClubsAsync_FiltersByStreet()
    {
        // Arrange
        var gajevaClub = ClubTestData.CreateClub(
            "Klub Gajeva",
            street: "Gajeva");

        var kraljaClub = ClubTestData.CreateClub(
            "Klub Kralja Petra",
            street: "Kralja Petra");

        SetupClubs(gajevaClub, kraljaClub);

        var request = new SearchClubsRequestDto
        {
            Street = "gajeva"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Klub Gajeva", result.Clubs[0].Name);
    }



    [Fact]
    public async Task SearchClubsAsync_ExcludesInactiveClubs()
    {
        // Arrange
        var activeClub = ClubTestData.CreateClub(
            "Aktivan klub",
            isActive: true);

        var inactiveClub = ClubTestData.CreateClub(
            "Neaktivan klub",
            isActive: false);

        SetupClubs(activeClub, inactiveClub);

        var request = new SearchClubsRequestDto();

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Aktivan klub", result.Clubs[0].Name);
    }

    [Fact]
    public async Task SearchClubsAsync_FiltersBySurfaceType()
    {
        // Arrange
        var hardClub = ClubTestData.CreateClub("Hard klub");
        hardClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Hard)
    };

        var clayClub = ClubTestData.CreateClub("Clay klub");
        clayClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Clay)
    };

        SetupClubs(hardClub, clayClub);

        var request = new SearchClubsRequestDto
        {
            SurfaceType = SurfaceType.Clay
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Clay klub", result.Clubs[0].Name);
        Assert.All(
            result.Clubs[0].Courts,
            court => Assert.Equal(SurfaceType.Clay, court.SurfaceType));
    }

    [Fact]
    public async Task SearchClubsAsync_FiltersByIndoor()
    {
        // Arrange
        var indoorClub = ClubTestData.CreateClub("Indoor klub");
        indoorClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(
            SurfaceType.Hard,
            isIndoor: true)
    };

        var outdoorClub = ClubTestData.CreateClub("Outdoor klub");
        outdoorClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(
            SurfaceType.Hard,
            isIndoor: false)
    };

        SetupClubs(indoorClub, outdoorClub);

        var request = new SearchClubsRequestDto
        {
            IsIndoor = true
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Indoor klub", result.Clubs[0].Name);
    }


    [Fact]
    public async Task SearchClubsAsync_FiltersByMinPrice()
    {
        // Arrange
        var cheapClub = ClubTestData.CreateClub("Jeftin klub");
        cheapClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(
            SurfaceType.Hard,
            price: 1000)
    };

        var expensiveClub = ClubTestData.CreateClub("Skuplji klub");
        expensiveClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(
            SurfaceType.Hard,
            price: 2000)
    };

        SetupClubs(cheapClub, expensiveClub);

        var request = new SearchClubsRequestDto
        {
            MinPrice = 1500
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Skuplji klub", result.Clubs[0].Name);
    }

    [Fact]
    public async Task SearchClubsAsync_FiltersByMaxPrice()
    {
        // Arrange
        var cheapClub = ClubTestData.CreateClub("Jeftin klub");
        cheapClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(
            SurfaceType.Hard,
            price: 1000)
    };

        var expensiveClub = ClubTestData.CreateClub("Skuplji klub");
        expensiveClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(
            SurfaceType.Hard,
            price: 2000)
    };

        SetupClubs(cheapClub, expensiveClub);

        var request = new SearchClubsRequestDto
        {
            MaxPrice = 1500
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.Equal("Jeftin klub", result.Clubs[0].Name);
    }
    [Fact]
    public async Task SearchClubsAsync_ExcludesClubWithoutMatchingCourts()
    {
        // Arrange
        var club = ClubTestData.CreateClub("Klub");
        club.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Clay)
    };

        SetupClubs(club);

        var request = new SearchClubsRequestDto
        {
            SurfaceType = SurfaceType.Hard
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Empty(result.Clubs);
        Assert.Equal(0, result.TotalCount);
    }

    [Fact]
    public async Task SearchClubsAsync_SortsByName()
    {
        // Arrange
        var zvezdara = ClubTestData.CreateClub("Zvezdara");
        var partizan = ClubTestData.CreateClub("Partizan");
        var arena = ClubTestData.CreateClub("Arena");

        SetupClubs(zvezdara, partizan, arena);

        var request = new SearchClubsRequestDto
        {
            SortBy = "name"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Equal("Arena", result.Clubs[0].Name);
        Assert.Equal("Partizan", result.Clubs[1].Name);
        Assert.Equal("Zvezdara", result.Clubs[2].Name);
    }

    [Fact]
    public async Task SearchClubsAsync_SortsByPriceAscending()
    {
        // Arrange
        var expensiveClub = ClubTestData.CreateClub("Skuplji");
        expensiveClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Hard, price: 2000)
    };

        var cheapClub = ClubTestData.CreateClub("Jeftiniji");
        cheapClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Hard, price: 1000)
    };

        SetupClubs(expensiveClub, cheapClub);

        var request = new SearchClubsRequestDto
        {
            SortBy = "price_asc"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Equal("Jeftiniji", result.Clubs[0].Name);
        Assert.Equal("Skuplji", result.Clubs[1].Name);
    }

    [Fact]
    public async Task SearchClubsAsync_SortsByPriceDescending()
    {
        // Arrange
        var expensiveClub = ClubTestData.CreateClub("Skuplji");
        expensiveClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Hard, price: 2000)
    };

        var cheapClub = ClubTestData.CreateClub("Jeftiniji");
        cheapClub.Courts = new List<ReservationCourtDto>
    {
        ClubTestData.CreateCourt(SurfaceType.Hard, price: 1000)
    };

        SetupClubs(expensiveClub, cheapClub);

        var request = new SearchClubsRequestDto
        {
            SortBy = "price_desc"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Equal("Skuplji", result.Clubs[0].Name);
        Assert.Equal("Jeftiniji", result.Clubs[1].Name);
    }

    [Fact]
    public async Task SearchClubsAsync_FiltersByMaxDistance()
    {
        // Arrange
        var club = ClubTestData.CreateClub("Zvezdara");

        SetupClubs(club);

        _geocodingServiceMock
            .Setup(x => x.GeocodeAsync(It.IsAny<string>()))
            .ReturnsAsync(new GeoLocationDto
            {
                Latitude = 44.7993846,
                Longitude = 20.4871742
            });

        var request = new SearchClubsRequestDto
        {
            Latitude = 44.815,
            Longitude = 20.487,
            MaxDistanceKm = 1
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Empty(result.Clubs);
    }

    [Fact]
    public async Task SearchClubsAsync_WithClubWithinMaxDistance_ReturnsClub()
    {
        // Arrange
        var club = ClubTestData.CreateClub("Zvezdara");

        SetupClubs(club);

        _geocodingServiceMock
            .Setup(x => x.GeocodeAsync(It.IsAny<string>()))
            .ReturnsAsync(new GeoLocationDto
            {
                Latitude = 44.7993846,
                Longitude = 20.4871742
            });

        var request = new SearchClubsRequestDto
        {
            Latitude = 44.815,
            Longitude = 20.487,
            MaxDistanceKm = 10
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Single(result.Clubs);
        Assert.NotNull(result.Clubs[0].DistanceKm);
    }

    [Fact]
    public async Task SearchClubsAsync_AppliesPagination()
    {
        // Arrange
        var clubs = Enumerable.Range(1, 5)
            .Select(i => ClubTestData.CreateClub($"Klub {i}"))
            .ToArray();

        SetupClubs(clubs);

        var request = new SearchClubsRequestDto
        {
            Page = 2,
            PageSize = 2,
            SortBy = "name"
        };

        // Act
        var result = await _service.SearchClubsAsync(request);

        // Assert
        Assert.Equal(2, result.Clubs.Count);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.PageSize);

        Assert.Equal("Klub 3", result.Clubs[0].Name);
        Assert.Equal("Klub 4", result.Clubs[1].Name);
    }

}