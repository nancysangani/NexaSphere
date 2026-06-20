import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SLACK_CONFIG_FILE = path.join(__dirname, '..', 'data', 'slack_config.json');

import pg from 'pg';
pg.Pool = class MockPool {
  on() {}
  async connect() {
    return {
      query: async () => ({ rows: [], rowCount: 1 }),
      release: () => {},
    };
  }
};

const mockFetchCalls = [];
globalThis.fetch = async (url, options) => {
  mockFetchCalls.push({ url, options });
  if (url.includes('oauth.v2.access')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        access_token: 'mock-bot-token',
        incoming_webhook: {
          url: 'mock-webhook-url',
          channel: 'mock-channel',
          channel_id: 'mock-channel-id',
        },
      }),
    };
  }
  if (url.includes('lookupByEmail')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        user: { id: 'U-MOCK-USER-ID' },
      }),
    };
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  };
};

import { slackRepository } from '../repositories/slackRepository.js';
import { slackIntegrationService } from '../services/slackIntegrationService.js';
import { studentUsersRepository } from '../repositories/studentUsersRepository.js';
import * as slackController from '../controllers/slackController.js';
import eventManager from '../services/eventEmitterService.js';

test.beforeEach(async () => {
  mockFetchCalls.length = 0;
  await slackRepository.deleteConfig();
});

test('slackRepository saves and retrieves config successfully', async () => {
  const config = {
    bot_token: 'token-abc',
    webhook_url: 'webhook-url',
    channel_name: 'events-channel',
    channel_id: 'C123',
    notify_new_events: true,
    notify_registrations: false,
    notify_announcements: true,
  };

  const saved = await slackRepository.saveConfig(config);
  assert.equal(saved.bot_token, 'token-abc');
  assert.equal(saved.notify_registrations, false);

  const retrieved = await slackRepository.getConfig();
  assert.equal(retrieved.bot_token, 'token-abc');
  assert.equal(retrieved.notify_new_events, true);
  assert.equal(retrieved.notify_registrations, false);
});

test('slackIntegrationService handleNewEventPublished sends a Slack notification', async () => {
  await slackRepository.saveConfig({
    bot_token: 'xoxb-test',
    channel_id: 'C999',
    notify_new_events: true,
  });

  await slackIntegrationService.handleNewEventPublished({
    eventId: 'evt-101',
    eventName: 'Super AI Meetup',
    eventDate: '2026-07-01',
    description: 'A grand meetup of developers',
  });

  const chatCall = mockFetchCalls.find(c => c.url.includes('chat.postMessage'));
  assert.ok(chatCall, 'should call postMessage Slack endpoint');
  const body = JSON.parse(chatCall.options.body);
  assert.equal(body.channel, 'C999');
  assert.ok(body.text.includes('Super AI Meetup'));
});

test('slackIntegrationService registration confirmed sends Slack message to channel', async () => {
  await slackRepository.saveConfig({
    bot_token: 'xoxb-test',
    channel_id: 'C999',
    notify_registrations: true,
  });

  await slackIntegrationService.handleRegistrationConfirmed({
    userName: 'John Doe',
    eventName: 'Web3 Workshop',
    eventDate: '2026-08-01',
  });

  const chatCall = mockFetchCalls.find(c => c.url.includes('chat.postMessage'));
  assert.ok(chatCall, 'should post registration message');
  const body = JSON.parse(chatCall.options.body);
  assert.ok(body.text.includes('John Doe'));
  assert.ok(body.text.includes('Web3 Workshop'));
});

test('slackIntegrationService DM reminder looks up User ID and sends DM', async () => {
  await studentUsersRepository.updateSlackSettings('student@test.com', {
    slackUserId: null,
    slackDmReminders: true,
  });

  await slackRepository.saveConfig({
    bot_token: 'xoxb-test',
    channel_id: 'C999',
  });

  await slackIntegrationService.handleEventReminder({
    userEmail: 'student@test.com',
    userName: 'Alice',
    eventName: 'Algorithms 101',
    eventDate: '2026-06-25',
    eventTime: '10:00 AM',
    eventLocation: 'Room 303',
  });

  const lookupCall = mockFetchCalls.find(c => c.url.includes('lookupByEmail'));
  assert.ok(lookupCall, 'should look up user on Slack by email');

  const dmCall = mockFetchCalls.find(c => c.url.includes('chat.postMessage') && JSON.parse(c.options.body).channel === 'U-MOCK-USER-ID');
  assert.ok(dmCall, 'should post DM reminder to Slack user ID');
  const body = JSON.parse(dmCall.options.body);
  assert.ok(body.text.includes('Algorithms 101'));
});

test('slackController handleSlackCommand returns upcoming events block payload', async () => {
  const req = {
    body: {
      command: '/nexasphere-events',
      text: '',
      user_id: 'U111',
    },
  };

  let jsonResult = null;
  const res = {
    json: (payload) => {
      jsonResult = payload;
      return res;
    },
  };

  await slackController.handleSlackCommand(req, res);

  assert.ok(jsonResult, 'should respond with json payload');
  assert.equal(jsonResult.response_type, 'ephemeral');
  assert.ok(jsonResult.blocks.length > 0, 'should contain message blocks');
  assert.ok(jsonResult.blocks[0].text.text.includes('Upcoming NexaSphere Events'));
});
