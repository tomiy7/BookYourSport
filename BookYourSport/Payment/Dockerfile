FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Payment/PaymentService.API/PaymentService.API.csproj", "Payment/PaymentService.API/"]
COPY ["Payment/PaymentService.Application/PaymentService.Application.csproj", "Payment/PaymentService.Application/"]
COPY ["Payment/PaymentService.Domain/PaymentService.Domain.csproj", "Payment/PaymentService.Domain/"]
COPY ["Payment/PaymentService.Infrastructure/PaymentService.Infrastructure.csproj", "Payment/PaymentService.Infrastructure/"]
COPY ["Messaging/Messaging.csproj", "Messaging/"]

RUN dotnet restore "Payment/PaymentService.API/PaymentService.API.csproj"

COPY . .

WORKDIR "/src/Payment/PaymentService.API"

RUN dotnet build "PaymentService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PaymentService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "PaymentService.API.dll"]