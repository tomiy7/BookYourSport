FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["AuthService.API/AuthService.API.csproj", "AuthService.API/"]

RUN dotnet restore "AuthService.API/AuthService.API.csproj"

COPY . .

RUN dotnet publish "AuthService.API/AuthService.API.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "AuthService.API.dll"]