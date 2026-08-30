FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Search/SearchService.API/SearchService.API.csproj", "Search/SearchService.API/"]
COPY ["Search/SearchService.Application/SearchService.Application.csproj", "Search/SearchService.Application/"]
COPY ["Search/SearchService.Domain/SearchService.Domain.csproj", "Search/SearchService.Domain/"]
COPY ["Search/SearchService.Infrastructure/SearchService.Infrastructure.csproj", "Search/SearchService.Infrastructure/"]

RUN dotnet restore "Search/SearchService.API/SearchService.API.csproj"

COPY . .

WORKDIR "/src/Search/SearchService.API"

RUN dotnet build "SearchService.API.csproj" -c Release -o /app/build

FROM build AS publish

RUN dotnet publish "SearchService.API.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "SearchService.API.dll"]