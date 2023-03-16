const { spawnSync, spawn } = require('child_process');
const fs = require('fs');

const args = process.argv.splice(2);

const PID = args[0];
const NEWPATH = args[1];
const ReplacePAHT = args[2];
const STARTPATH = args[3];

spawn('notepad', [], { detached: true });