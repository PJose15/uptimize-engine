/**
 * Notifications Utility
 * Send Slack and Email notifications when pipeline completes
 */

export interface NotificationConfig {
    slackWebhookUrl?: string;
    emailTo?: string;
    emailFrom?: string;
}

export interface PipelineNotification {
    runId: string;
    status: 'success' | 'partial' | 'failed';
    duration: number;
    agentCount: number;
    successCount: number;
    totalCost?: number;
    leadsSummary: string;
}

/**
 * Send Slack notification
 */
export async function sendSlackNotification(
    webhookUrl: string,
    notification: PipelineNotification
): Promise<boolean> {
    const statusEmoji = notification.status === 'success' ? '✅' :
        notification.status === 'partial' ? '⚠️' : '❌';

    const durationMin = (notification.duration / 1000 / 60).toFixed(1);

    const payload = {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${statusEmoji} Pipeline ${notification.status.toUpperCase()}`,
                    emoji: true
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Duration:*\n${durationMin} minutes`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Agents:*\n${notification.successCount}/${notification.agentCount} completed`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Cost:*\n$${(notification.totalCost || 0).toFixed(4)}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Run ID:*\n${notification.runId}`
                    }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Leads:*\n${notification.leadsSummary.substring(0, 200)}...`
                }
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'View Results',
                            emoji: true
                        },
                        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/history/${notification.runId}`
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to send Slack notification:', error);
        return false;
    }
}

/**
 * Send email notification (requires nodemailer setup)
 */
export async function sendEmailNotification(
    config: { to: string; from: string },
    notification: PipelineNotification
): Promise<boolean> {
    // For now, just log - in production, use nodemailer or a service like Resend
    console.log('📧 Email notification would be sent to:', config.to);
    console.log('Subject: Pipeline', notification.status, '- Run', notification.runId);

    // TODO: Implement with nodemailer when SMTP is configured
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});

    return true;
}

/**
 * Load notification config from environment or settings
 */
export function getNotificationConfig(): NotificationConfig {
    return {
        slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
        emailTo: process.env.NOTIFICATION_EMAIL_TO,
        emailFrom: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@uptimize.local',
    };
}

/**
 * Send all configured notifications
 */
export async function notifyPipelineComplete(
    notification: PipelineNotification
): Promise<{ slack: boolean; email: boolean }> {
    const config = getNotificationConfig();
    const results = { slack: false, email: false };

    if (config.slackWebhookUrl) {
        results.slack = await sendSlackNotification(config.slackWebhookUrl, notification);
    }

    if (config.emailTo) {
        results.email = await sendEmailNotification(
            { to: config.emailTo, from: config.emailFrom || '' },
            notification
        );
    }

    return results;
}
