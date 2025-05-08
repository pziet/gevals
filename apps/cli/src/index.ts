#!/usr/bin/env node
import { Command } from "commander";
import runCmd from "./commands/run.js";
import dataCmd from "./commands/data.js";
import displayCmd from "./commands/display.js";

const program = new Command("gevals")
  .description("Granola evaluation framework");

program
  .addCommand(runCmd)
  .addCommand(dataCmd)
  .addCommand(displayCmd);

program.parseAsync(process.argv);