Fix the 3D horn generation code:

Bolt holes are not visible on either flange; add them. In rectangle mode, use maximum spacing, with bolts starting from the corners and centered on the flange width (from horn exit to flange size).
Wall thickness is expanding inward; it should expand outward only. The inside dimensions must remain unchanged.
Flanges do not have openings. The compression driver flange should have an opening equal to the driver mount throat size. The flange size should be defined by the driver mount, and the bolt circle must not exceed flange size minus bolt diameter.
The mounting plate flange should have an opening starting at the horn exit size.
Ensure all geometry, openings, and bolt holes are correct for both circular and rectangular modes.
Update the 3D horn generation code so the horn is defined by both throat shape and exit shape. The geometry should smoothly transition from the throat shape to the exit shape, supporting both circular and rectangular profiles.