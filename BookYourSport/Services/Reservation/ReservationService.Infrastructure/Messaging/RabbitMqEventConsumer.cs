using Messaging;
using Messaging.Events;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using ReservationService.Domain.Interfaces;
using System.Text;
using System.Text.Json;

namespace ReservationService.Infrastructure.Messaging;

public class RabbitMqEventConsumer : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;

    public RabbitMqEventConsumer(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
    }


    protected override async Task ExecuteAsync(
        CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory
        {
            HostName =
                _configuration["RabbitMQ:Host"]
                ?? "localhost",

            UserName =
                _configuration["RabbitMQ:Username"]
                ?? "guest",

            Password =
                _configuration["RabbitMQ:Password"]
                ?? "guest"
        };


        Console.WriteLine(
            $"[RabbitMQ] Host: {factory.HostName}");

        Console.WriteLine(
            $"[RabbitMQ] Username: {factory.UserName}");


        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await using var connection =
                    await factory.CreateConnectionAsync(
                        cancellationToken);


                await using var channel =
                    await connection.CreateChannelAsync(
                        cancellationToken:
                        cancellationToken);


                await channel.ExchangeDeclareAsync(
                    exchange:
                    "bookyoursport.events",

                    type:
                    ExchangeType.Fanout,

                    durable:
                    true,

                    cancellationToken:
                    cancellationToken);


                var queue =
                    await channel.QueueDeclareAsync(
                        queue:
                        "reservation-service",

                        durable:
                        true,

                        exclusive:
                        false,

                        autoDelete:
                        false,

                        cancellationToken:
                        cancellationToken);


                await channel.QueueBindAsync(
                    queue:
                    queue.QueueName,

                    exchange:
                    "bookyoursport.events",

                    routingKey:
                    string.Empty,

                    cancellationToken:
                    cancellationToken);


                var consumer =
                    new AsyncEventingBasicConsumer(
                        channel);


                consumer.ReceivedAsync +=
                    async (_, args) =>
                    {
                        try
                        {
                            var message =
                                Encoding.UTF8.GetString(
                                    args.Body.ToArray());


                            Console.WriteLine(
                                $"[RabbitMQ] Received event: {message}");


                            using var document =
                                JsonDocument.Parse(
                                    message);


                            var eventType =
                                document.RootElement
                                    .GetProperty(
                                        "EventType")
                                    .GetString();


                            var data =
                                document.RootElement
                                    .GetProperty(
                                        "Data")
                                    .GetRawText();


                            using var scope =
                                _scopeFactory.CreateScope();


                            var reservationRepository =
                                scope.ServiceProvider
                                    .GetRequiredService<
                                        IReservationRepository>();


                            switch (eventType)
                            {
                                // ==========================================
                                // PAYMENT SUCCEEDED
                                // ==========================================

                                case nameof(PaymentSucceeded):
                                {
                                    var paymentSucceeded =
                                        JsonSerializer.Deserialize<
                                            PaymentSucceeded>(
                                            data);


                                    if (paymentSucceeded
                                        is null)
                                    {
                                        throw
                                            new InvalidOperationException(
                                                "Could not deserialize PaymentSucceeded event.");
                                    }


                                    var reservation =
                                        await reservationRepository
                                            .GetByIdAsync(
                                                paymentSucceeded
                                                    .ReservationId);


                                    if (reservation
                                        is null)
                                    {
                                        throw
                                            new InvalidOperationException(
                                                "Reservation not found.");
                                    }


                                    // Ako je rezervacija već potvrđena,
                                    // event je već obrađen.
                                    if (reservation.Status
                                        .ToString()
                                        .Equals(
                                            "Confirmed",
                                            StringComparison
                                                .OrdinalIgnoreCase))
                                    {
                                        Console.WriteLine(
                                            "[RabbitMQ] Reservation is already confirmed. Ignoring duplicate PaymentSucceeded event.");

                                        break;
                                    }


                                    reservation.Confirm();


                                    await reservationRepository
                                        .SaveChangesAsync();


                                    break;
                                }


                                // ==========================================
                                // REFUND SUCCEEDED
                                // ==========================================

                                case nameof(RefundSucceeded):
                                {
                                    var refundSucceeded =
                                        JsonSerializer.Deserialize<
                                            RefundSucceeded>(
                                            data);


                                    if (refundSucceeded
                                        is null)
                                    {
                                        throw
                                            new InvalidOperationException(
                                                "Could not deserialize RefundSucceeded event.");
                                    }


                                    var reservation =
                                        await reservationRepository
                                            .GetByIdAsync(
                                                refundSucceeded
                                                    .ReservationId);


                                    if (reservation
                                        is null)
                                    {
                                        throw
                                            new InvalidOperationException(
                                                "Reservation not found.");
                                    }


                                    // Otkazivanje rezervacije se OD SADA uvek radi sinhrono,
                                    // odmah nakon uspešnog poziva ka Payment Service-u
                                    // (u ReservationBookingService.CancelReservationAsync i
                                    // CancelUpcomingReservationsForCourtAsync), isti obrazac
                                    // kao Confirm() posle uspešne naplate.
                                    //
                                    // Namerno OVDE VIŠE NE diramo status/razlog rezervacije:
                                    // dva nezavisna pisca (ovaj event + sinhrono otkazivanje)
                                    // su izazivala trku pri kojoj bi se razlog otkazivanja
                                    // izgubio. Sinhroni put je sad jedini izvor istine;
                                    // ovaj event samo evidentiramo radi vidljivosti u logu.
                                    Console.WriteLine(
                                        $"[RabbitMQ] RefundSucceeded for reservation {refundSucceeded.ReservationId} noted (cancellation handled synchronously elsewhere).");


                                    break;
                                }


                                // ==========================================
                                // RESERVATION CANCELLED
                                // ==========================================

                                case nameof(ReservationCancelled):
                                {
                                    var reservationCancelled =
                                        JsonSerializer.Deserialize<
                                            ReservationCancelled>(
                                            data);


                                    if (reservationCancelled
                                        is null)
                                    {
                                        throw
                                            new InvalidOperationException(
                                                "Could not deserialize ReservationCancelled event.");
                                    }


                                    var reservation =
                                        await reservationRepository
                                            .GetByIdAsync(
                                                reservationCancelled
                                                    .ReservationId);


                                    if (reservation
                                        is null)
                                    {
                                        throw
                                            new InvalidOperationException(
                                                "Reservation not found.");
                                    }


                                    // Isti razlog kao kod RefundSucceeded gore:
                                    // otkazivanje se radi sinhrono na mestu koje inicira
                                    // refund, pa ovde više ništa ne pišemo u bazu.
                                    Console.WriteLine(
                                        $"[RabbitMQ] ReservationCancelled for reservation {reservationCancelled.ReservationId} noted (cancellation handled synchronously elsewhere).");


                                    break;
                                }


                                default:

                                    throw
                                        new InvalidOperationException(
                                            $"Unknown event type: {eventType}");
                            }


                            // ==========================================
                            // SUCCESSFULLY PROCESSED
                            // ==========================================

                            await channel.BasicAckAsync(
                                args.DeliveryTag,

                                multiple:
                                false,

                                cancellationToken:
                                cancellationToken);
                        }


                        catch (Exception ex)
                        {
                            Console.WriteLine(
                                $"[RabbitMQ] Error processing event: {ex.Message}");


                            // ==========================================
                            // IMPORTANT
                            // ==========================================
                            //
                            // Ne vraćamo poruku odmah nazad u queue.
                            // U suprotnom business exception može napraviti
                            // beskonačnu RabbitMQ petlju.
                            //
                            // Za produkciju bi ovde idealno išao DLQ.
                            // Za sada odbacujemo problematičnu poruku.
                            // ==========================================

                            await channel.BasicNackAsync(
                                args.DeliveryTag,

                                multiple:
                                false,

                                requeue:
                                false,

                                cancellationToken:
                                cancellationToken);
                        }
                    };


                await channel.BasicConsumeAsync(
                    queue:
                    queue.QueueName,

                    autoAck:
                    false,

                    consumer:
                    consumer,

                    cancellationToken:
                    cancellationToken);


                Console.WriteLine(
                    "[RabbitMQ] Connected and consuming events.");


                await Task.Delay(
                    Timeout.Infinite,
                    cancellationToken);
            }


            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                break;
            }


            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[RabbitMQ] Connection failed: {ex.Message}");


                Console.WriteLine(
                    "[RabbitMQ] Retrying in 5 seconds...");


                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    cancellationToken);
            }
        }
    }
}