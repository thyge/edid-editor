# edid-editor

Client side EDID Viewer and editor

The project is a continuation of [goedid](https://github.com/thyge/goedid)

The project is implimented as a vue app but all EDID decoding and editing is contained in the [edidjs](https://github.com/thyge/edid-editor/tree/main/src/edidjs) directory.
##  Goals:
* Being able to visualise EDID, CEA and DisplayID
* Being able to edit key aspects of EDID CEA and DisplayID

### TODOS:
* Create CVT generator for adding Detailed Timing Descriptions to EDID and CEA extension
* Create CEA Block generator for adding CEA blocks to CEA extension

### Inspired by:

* https://tomverbeure.github.io/video_timings_calculator
* https://github.com/dgallegos/edidreader
* https://github.com/ValZapod/edid-decode
* https://www.monitortests.com/forum/Thread-Custom-Resolution-Utility-CRU