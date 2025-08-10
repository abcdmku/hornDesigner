Fix the 3D horn generation code:

- The horn must have wall thickness and expand outward, but never extend past the defined z height.
- The compression driver mounting flange should be centered on the horn mouth, with its bottom aligned to the horn’s bottom, and must not make the horn longer. The flange should have thickness but must not cross into the radiating side of the horn.
- The horn mounting flange for a box should be centered on the horn’s exit, not add depth, and not cross into the horn’s inside.
- Add mounting holes to both flanges, the ui lists these as a parameter but i do not see them added to either flange.
- Rectangle mode does not work; the horn is always circular. Fix rectangle mode so it generates a rectangular horn.
- Make sure all geometry is correct and flanges/mounts are properly positioned and sized.