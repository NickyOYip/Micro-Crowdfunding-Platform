// This file provides helper functions for manipulating blockchain time in tests

const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Advances the blockchain time to a specific timestamp
 * @param {number} timestamp - The timestamp to advance to
 */
async function advanceTimeTo(timestamp) {
  await time.increaseTo(timestamp);
}

/**
 * Advances the blockchain time by a number of seconds
 * @param {number} seconds - The number of seconds to advance
 */
async function advanceTimeBySeconds(seconds) {
  await time.increase(seconds);
}

/**
 * Advances the blockchain time by a number of days
 * @param {number} days - The number of days to advance
 */
async function advanceTimeByDays(days) {
  const seconds = days * 86400;
  await time.increase(seconds);
}

module.exports = {
  advanceTimeTo,
  advanceTimeBySeconds,
  advanceTimeByDays
};
