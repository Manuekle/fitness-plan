import { Redis } from "@upstash/redis";
import { createNotification } from "@/lib/notification-service";

export const subscriberClient = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

export const NOTIFICATION_CHANNEL = "notifications";
export const WATER_INTAKE_CHANNEL = "water-intake";

// For Upstash Redis, we need to use the HTTP-based approach
export async function initNotificationSubscriber() {
  try {
    // Set up a polling mechanism to check for new messages
    const checkForNotifications = async () => {
      try {
        // Get notifications from the channel
        const notifications = await subscriberClient.lrange(
          NOTIFICATION_CHANNEL,
          0,
          -1
        );

        // Process each notification
        for (const message of notifications) {
          try {
            const data = JSON.parse(message);
            const { userId, notification } = data;

            if (userId && notification) {
              await createNotification({
                userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
              });

              console.log(
                `Notification created for user ${userId}: ${notification.title}`
              );
            }
          } catch (error) {
            console.error("Error processing notification message:", error);
          }
        }

        // Clear processed notifications
        if (notifications.length > 0) {
          await subscriberClient.ltrim(
            NOTIFICATION_CHANNEL,
            notifications.length,
            -1
          );
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    // Check water intake
    const checkWaterIntake = async () => {
      try {
        const intakeUpdates = await subscriberClient.lrange(
          WATER_INTAKE_CHANNEL,
          0,
          -1
        );

        for (const message of intakeUpdates) {
          try {
            const data = JSON.parse(message);
            const { userId, intake, targetIntake } = data;

            if (userId && intake && targetIntake) {
              if (intake >= targetIntake) {
                await createNotification({
                  userId,
                  title: "Meta de agua alcanzada",
                  message:
                    "¡Felicidades! Has alcanzado tu meta diaria de consumo de agua.",
                  type: "water",
                });

                console.log(
                  `Water goal notification created for user ${userId}`
                );
              }
            }
          } catch (error) {
            console.error("Error processing water intake message:", error);
          }
        }

        if (intakeUpdates.length > 0) {
          await subscriberClient.ltrim(
            WATER_INTAKE_CHANNEL,
            intakeUpdates.length,
            -1
          );
        }
      } catch (error) {
        console.error("Error checking water intake:", error);
      }
    };

    // Set up interval for polling
    const notificationInterval = setInterval(checkForNotifications, 5000); // Check every 5 seconds
    const waterIntakeInterval = setInterval(checkWaterIntake, 5000);

    console.log("Redis polling initialized");

    // Return a function to clean up intervals if needed
    return () => {
      clearInterval(notificationInterval);
      clearInterval(waterIntakeInterval);
    };
  } catch (error) {
    console.error("Failed to initialize Redis polling:", error);
  }
}
