FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PaymentService.API/PaymentService.API.csproj", "PaymentService.API/"]
COPY ["PaymentService.Application/PaymentService.Application.csproj", "PaymentService.Application/"]
COPY ["PaymentService.Domain/PaymentService.Domain.csproj", "PaymentService.Domain/"]
COPY ["PaymentService.Infrastructure/PaymentService.Infrastructure.csproj", "PaymentService.Infrastructure/"]

RUN dotnet restore "PaymentService.API/PaymentService.API.csproj"

COPY . .
WORKDIR "/src/PaymentService.API"

RUN dotnet build "PaymentService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PaymentService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "PaymentService.API.dll"]