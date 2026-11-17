# Camera template reference for OQ-7

Research date: **2026-11-17** (America/Chicago). Official manufacturer/optics sources checked for a practical POC recommendation. This note does not change accepted requirements or implementation.

## Verified distinctions

- **Lens setting and angles:** a fixed lens has one focal length; a varifocal lens has an adjustable focal length and field of view. Horizontal and vertical FoV are angles, influenced by lens and sensor geometry. [Axis, *Lenses in surveillance*, “Lens types” and “Field of view”](https://whitepapers.axis.com/en-us/lenses-in-surveillance).
- **Model and capture mode matter:** the AXIS F2115-R specifies a 3.2–5.7 mm varifocal lens, but its 1080p and 720p modes have different horizontal and vertical FoV ranges. A model number and focal range alone therefore do not identify the analysis configuration. [Manufacturer datasheet, page 2](https://www.axis.com/dam/public/40/a1/b7/datasheet-axis-f2115-r-varifocal-sensor-en-US-495204.pdf#page=2). A fixed-lens example, AXIS FA1105, separately lists 1920×1080 maximum resolution, 2.8 mm focal length and 111°/61° horizontal/vertical FoV. These are source specifications, not evidence that its maximum resolution is the configured stream. [Axis FA1105 specifications](https://www.axis.com/products/axis-fa1105-sensor-unit).
- **Optical format is not active width:** nominal inch-format labels are historical conventions; calculation needs the active physical dimensions for the relevant sensor area. [Edmund Optics, “Sensor Size”](https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-camera-sensors-for-machine-vision-applications/). For example, Basler separately lists a 1.1-inch format and a 16.8 mm effective diagonal. [Basler a2A5320-52cm specifications](https://docs.baslerweb.com/a2a5320-52cm).
- **Pixel density is a planning model:** lighting, optics, compression and viewing conditions affect usable detail. Meeting a density target does not establish that recognition or identification will succeed. [Axis, *Pixel density based on IEC 62676-4:2014*, “A simplified model of a complex reality”](https://whitepapers.axis.com/en-us/pixel-density-based-on-iec-62676-4-2014).

## Recommended template and instance inputs

This is the proposed product interpretation of those references.

| Input group | Practical POC treatment |
| --- | --- |
| Identity and provenance | Select/search a reusable manufacturer + model + lens/variant template; retain a generic/custom option. Record source URL/date and whether each optical value is manufacturer-specified, measured, or estimated. A small curated library is sufficient initially. |
| Resolution/profile | Store pixel width × height, selected capture/stream mode, aspect/orientation and any known crop. Preserve maximum supported resolution separately from the configured analysis resolution. Megapixels alone are insufficient. |
| Fixed lens | Store the fixed focal length and the source H/V FoV for the applicable profile. A replacement lens becomes a distinct variant or explicit override. |
| Varifocal lens | Store minimum/maximum focal length and the per-camera selected focal length. Tie FoV values or lookup data to their known settings/mode. A range without a selected setting is incomplete for one deployed view. |
| Optical calculation basis | Use known H/V FoV for the selected setting, or an explicitly approximate rectilinear model using active sensor width/height and focal length. Store nominal sensor format separately. Do not force published H/V angles to match a simplified aspect-derived relation by silently changing them. Expose unsupported or estimated geometry. |
| Placement and analysis | Retain bearing, mounting height, tilt, analysis distance/boundary and target plane/height, plus obstruction treatment. These are placement inputs, not properties inferred from the model number. |

If intermediate varifocal calibration is unavailable, offer documented endpoints or an explicit estimated/manual setting. Do not invent an exact focal-length-to-FoV curve or present interpolation as manufacturer data. A resolution-only downsample may preserve FoV; a capture crop can change it. Do not infer active sensor dimensions from output pixels unless the physical pixel mapping is known.

## Angles versus scene dimensions

For an ideal rectilinear view of a plane perpendicular to the optical axis at axial distance `d`:

- Scene width = `2 × d × tan(HFoV / 2)`; scene height = `2 × d × tan(VFoV / 2)`.
- A sensor-derived horizontal angle is `2 × atan(active sensor width / (2 × focal length))`, with both optical dimensions in the same units.
- Nominal horizontal pixel density is `horizontal pixel count / scene width`, in pixels per meter when width is meters.

These are explanatory approximations, not a replacement for the POC's tilted-plane, height and obstruction geometry. Distorted/wide-angle lenses need particular care; published angles and uniform density estimates do not establish uniform detail everywhere in the image. [Edmund Optics calculator: equations and approximation limits](https://www.edmundoptics.com/knowledge-center/tech-tools/imaging-system-parameter-calculator/), [Axis lens calculator limitations](https://whitepapers.axis.com/en-us/lenses-in-surveillance).

## Preserve the existing DORI convention

The current PRD/addendum records **25 / 63 / 125 / 250 pixels per meter** for Detect / Observe / Recognize / Identify. Retain that named convention, the current projection assumptions, and best-unobstructed-camera combination rule; do not sum densities across cameras or silently adopt another edition's categories. Model templates supply optical inputs, not universal DORI distances. Results remain estimates, do not establish standards compliance, and cannot supply a field-test Pass. Analytics and thermal-camera criteria are outside this optical-template recommendation.
