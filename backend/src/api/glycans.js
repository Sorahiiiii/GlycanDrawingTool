import { EXPORT_SIZES } from "../../../shared/domain/export-sizes.js";
import { SNFG_PRESETS } from "../../../shared/domain/snfg-presets.js";

export function glycanPresetsHandler(request, response) {
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({
    presets: SNFG_PRESETS,
    exportSizes: EXPORT_SIZES,
  }));
}

export default glycanPresetsHandler;
