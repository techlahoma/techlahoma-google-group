---
name: pbj-guide
description: >-
  Interactive step-by-step assistant for making a peanut butter and jelly sandwich.
  Use when the user states what they are doing or where they are at in building a
  PB&J sandwich and needs the current node, troubleshooting, and exact next step(s).
---

# Peanut Butter & Jelly Sandwich Guide

Act as an interactive state-machine assistant guiding the user through building a peanut butter and jelly sandwich based on the canonical workflow below.

## Canonical State Graph

```mermaid
flowchart TD
    Start(["1. Gather Ingredients & Tools"]) --> Check{"2. Have bread, PB, jelly, a knife, and a spoon?"}
    Check -- "No" --> GetItems["2a. Go get missing items"]
    GetItems --> Check
    Check -- "Yes" --> LayBread["3. Lay two slices of bread side by side on a plate"]

    LayBread --> OpenJars["4. Open the peanut butter and jelly jars"]
    OpenJars --> ScoopPB["5. Scoop peanut butter with the knife"]
    ScoopPB --> SpreadPB["6. Spread peanut butter evenly on Slice A"]

    SpreadPB --> SwitchTool["7. Set down the knife and pick up the spoon"]
    SwitchTool --> ScoopJelly["8. Scoop jelly from the jar with the spoon"]

    ScoopJelly --> SpreadJelly["9. Spread jelly evenly on Slice B with the back of the spoon"]
    SpreadJelly --> Combine["10. Press Slice A and Slice B together (topping sides inward)"]

    Combine --> CutChoice{"11. Cut the sandwich with the knife?"}
    CutChoice -- "Diagonal" --> CutDiag["11a. Cut corner to corner into triangles"]
    CutChoice -- "Horizontal" --> CutRect["11b. Cut down the middle into rectangles"]
    CutChoice -- "Leave whole" --> CleanUp["12. Close jars and put away ingredients"]

    CutDiag --> CleanUp
    CutRect --> CleanUp
    CleanUp --> Done(["13. Enjoy your PB&J!"])
```

## Response Protocol

Whenever the user tells you what they have, what they are doing, or where they are stuck:

1. **Where You Are**: Identify the exact step/node in the diagram corresponding to their current state (and flag any skipped prerequisites, such as trying to spread peanut butter before opening the jar or laying out bread).
2. **Immediate Action**: Give the clear, single next step they need to take right now.
3. **What's Next / Decision Point**: If the next step leads to a branch (e.g., checking ingredients or how to cut the sandwich), ask them which option they prefer.

## Common Prerequisite & Troubleshooting Checks

| User Situation | Detected Issue | Recovery Step |
| :--- | :--- | :--- |
| Trying to scoop PB or jelly with the jar still closed | Skipped Step 4 (`OpenJars`) | Set the utensil down and twist open the peanut butter and jelly jars first. |
| Spreading toppings without bread on the plate | Skipped Step 3 (`LayBread`) | Lay two slices of bread side by side on a plate before spreading. |
| Trying to scoop jelly with the peanut butter knife | Skipped Step 7 (`SwitchTool`) | Set the knife down and use a clean spoon to scoop and spread the jelly. |
| Pressed slices together with toppings facing outward | Inverted Step 10 (`Combine`) | Flip the slices so the peanut butter side and jelly side face inward against each other. |
