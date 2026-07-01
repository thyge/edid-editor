# edid-editor

Client side EDID Viewer and editor

The project is a continuation of [goedid](https://github.com/thyge/goedid)

The project is implimented as a vue app but all EDID decoding and editing is contained in the [edidts](https://github.com/thyge/edid-editor/tree/main/src/edidts) directory.
##  Goals:
* Being able to visualise EDID, CEA and DisplayID
* Being able to edit key aspects of EDID CEA and DisplayID

### TODOS:
* Create CVT generator for adding Detailed Timing Descriptions to EDID and CEA extension
* Create CEA Block generator for adding CEA blocks to CEA extension

### Testing

```sh
npm test            # run the Vue app + edidts test suites (in-module fixtures only)
npm run test:corpus # run the edidts corpus tests against the linuxhw/EDID collection
```

The corpus run exercises the parser against the ~175k real EDIDs in
[linuxhw/EDID](https://github.com/linuxhw/EDID). That collection is **not** tracked
in this repo — clone it locally (one-time, ~5 GB) where the loader reads from:

```sh
git clone --depth=1 https://github.com/linuxhw/EDID.git packages/edidts/tests/fixtures-linuxhw
```

The `packages/edidts/tests/fixtures-linuxhw/` directory (and a root `tests/`
checkout) is gitignored. If the directory is absent the loader silently skips it
and falls back to the in-module fixtures, so CI and fresh clones see no change.
To run a deterministic sample instead of the full corpus, set `EDID_FIXTURE_LIMIT`
(see `packages/edidts/README.md` for details).

### Inspired by:

* https://tomverbeure.github.io/video_timings_calculator
* https://github.com/dgallegos/edidreader
* https://github.com/ValZapod/edid-decode
* https://www.monitortests.com/forum/Thread-Custom-Resolution-Utility-CRU