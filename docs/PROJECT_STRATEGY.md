# Project Strategy

## Core idea
We are not committing to a single narrow product before the official case.

We prepare a reusable **Adaptive Optimization Engine** and a team workflow that can be adapted quickly.

Generic loop:

`State -> Candidate Policy -> Evaluation -> Metrics/Fitness -> Selection/Improvement -> New Policy`

The goal is measurable improvement, not "AI for the sake of AI."

## Prepared sandbox: traffic lights
Example baseline:
- Direction A: fixed green time.
- Direction B: fixed green time.
- Same cycle independent of real load.

Adaptive version:
- observe traffic/load;
- evaluate candidate policies;
- change timing/strategy;
- compare against baseline;
- keep only measurable improvements.

This sandbox exists to test architecture and workflow.
It is NOT proof that the final hackathon solution must be about traffic.

## Rule for the official case
Translate any case into:

`Problem -> State -> Actions -> Constraints -> Metrics -> Baseline -> Optimizer -> Validation -> Demo`

If we cannot fill this chain, we do not yet understand the case well enough to code.

## MVP principle
Under time pressure:
1. one working baseline;
2. one measurable optimization;
3. one end-to-end vertical slice;
4. one reliable demo;
5. then improvements.

A small complete system is better than a large unfinished architecture.
