"use strict";
console.log('Ballad extension loaded');
// get cookies, destructure, and log to web console
console.log(localStorage);
const { wins, streak, totalGuessCount, lastWinDay } = JSON.parse(localStorage.getItem('stats')).state;
console.log(`total_wins: ${wins}, win_streak: ${streak}, total_guesses: ${totalGuessCount}, last_win_day: ${lastWinDay}`);
// parse important data
const currentDay = getCurrentDayNumber(); // days since balatrodle epoch
const lastWinDate = translateDay(lastWinDay); // date object for last user win
const averageGuessesToWin = (totalGuessCount / wins); // get the average guesses it takes for a user to win
console.table({ 'currentDay': currentDay, 'lastWinDate': lastWinDate, 'averageGuessesToWin': averageGuessesToWin });
const statsData = {
    wins: wins,
    streak: streak,
    lastWin: lastWinDate,
    average: averageGuessesToWin,
};
chrome.runtime.sendMessage({
    type: 'stats',
    data: statsData,
});
// helpers:
// gets current days since balatrodle epoch based on date
function getCurrentDayNumber() {
    const startDate = new Date('2024-06-09'); // balatrodle epoch
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - startDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 == today
    console.log(dayDiff);
    return dayDiff;
}
// gets days since balatrodle epoch and converts to a date
function translateDay(dayNumber) {
    const epoch = new Date('2024-06-09');
    const currentDate = new Date(epoch);
    currentDate.setDate(epoch.getDate() + dayNumber);
    return currentDate;
}
