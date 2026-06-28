# Bug: Example Bug

> Example only. Replace or delete in real projects.

## Date
2026-06-22

## Status
Fixed

## Symptom
Example request returns a timeout.

## Impact
User cannot complete the example flow.

## Root cause
The downstream service was called without timeout handling.

## Fast debug steps
1. Check recent deploy.
2. Check application logs.
3. Check downstream health.

## Reproduction
Send the example request while downstream is unavailable.

## Fix
Add timeout and user-friendly failure handling.

## Regression tests
Mock downstream timeout.

## Related feature
Example Feature.

## Related decision
None.

## Lessons learned
Always document failure modes beside feature behavior.
