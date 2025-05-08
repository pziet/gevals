#!/usr/bin/env node
import { Command } from "commander";
import runCmd from "./commands/run";
import dataCmd from "./commands/data";
import displayCmd from "./commands/display";

const program = new Command("gevals")
  .description("Granola evaluation framework");

program
  .addCommand(runCmd)
  .addCommand(dataCmd)
  .addCommand(displayCmd);

program.parseAsync(process.argv);