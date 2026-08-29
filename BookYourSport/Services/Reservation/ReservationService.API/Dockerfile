FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Services/Reservation/ReservationService.API/ReservationService.API.csproj", "Services/Reservation/ReservationService.API/"]
COPY ["Services/Reservation/ReservationService.Application/ReservationService.Application.csproj", "Services/Reservation/ReservationService.Application/"]
COPY ["Services/Reservation/ReservationService.Domain/ReservationService.Domain.csproj", "Services/Reservation/ReservationService.Domain/"]
COPY ["Services/Reservation/ReservationService.Infrastructure/ReservationService.Infrastructure.csproj", "Services/Reservation/ReservationService.Infrastructure/"]
RUN dotnet restore "Services/Reservation/ReservationService.API/ReservationService.API.csproj"
COPY . .
WORKDIR "/src/Services/Reservation/ReservationService.API"
RUN dotnet build "./ReservationService.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ReservationService.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ReservationService.API.dll"]
