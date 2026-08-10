/* Formula-bar typing flourish. The real headline (h2) stays static for
   assistive tech / no-JS / SEO; only the aria-hidden formula-bar mirror
   animates, and only when the user allows motion. */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fx = document.getElementById('ec-fx-value');
  if (!fx) return;
  var text = fx.textContent;
  fx.textContent = '';
  fx.classList.add('ec-formulabar__value--typing');
  var i = 0;
  var tick = function () {
    fx.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, 34);
    else fx.classList.remove('ec-formulabar__value--typing');
  };
  setTimeout(tick, 350);
})();

/* Spreadsheet import: drop or browse a .csv/.ods/.xlsx, PUT it to ./_/:id,
   then open the new sheet. Multi-sheet workbooks become id.1..id.N plus a
   TOC room at ./=id. (xlsx2socialcalc.js portion (C) 2014 SheetJS,
   Apache 2.0.) */
var rABS = typeof FileReader !== "undefined" && typeof FileReader.prototype !== "undefined" && typeof FileReader.prototype.readAsBinaryString !== "undefined";
function fixdata(data) {
	var o = "", l = 0, w = 10240;
	for(; l<data.byteLength/w; ++l)
		o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
	o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(o.length)));
	return o;
}

function utf8TextFromPayload(data) {
	if (data instanceof ArrayBuffer) return new TextDecoder('utf-8').decode(data);
	var bytes = new Uint8Array(data.length);
	for (var i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 0xff;
	return new TextDecoder('utf-8').decode(bytes);
}

function isZipPayload(data) {
	if (data instanceof ArrayBuffer) {
		if (data.byteLength < 4) return false;
		var bytes = new Uint8Array(data, 0, 4);
		return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
	}
	return data.length >= 4 &&
		data.charCodeAt(0) === 0x50 &&
		data.charCodeAt(1) === 0x4b &&
		data.charCodeAt(2) === 0x03 &&
		data.charCodeAt(3) === 0x04;
}

function isCsvCandidate(file, data) {
	if (isZipPayload(data)) return false;
	return file.type === 'text/csv' || /\.csv$/i.test(file.name);
}

// cb is typically process_wb
function xlsxworker(data, cb, id) {
	var worker = new Worker('./static/xlsxworker.js');
	worker.onmessage = function(e) {
		switch(e.data.t) {
			case 'ready': break;
			case 'e': console.error(e.data.d); importFailed(); break;
			case 'xlsx': cb(JSON.parse(e.data.d), id); break;
		}
	};
	var arr = rABS ? data : btoa(fixdata(data));
	worker.postMessage({d:arr,b:rABS});
}

/* xlsx2socialcalc.js (C) 2014 SheetJS -- http://sheetjs.com */
/* License: Apache 2.0 */
/* vim: set ts=2: */
var sheet_to_socialcalc = (function() {
        var header = [
                "socialcalc:version:1.5",
                "MIME-Version: 1.0",
                "Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave"
        ].join("\n");

        var sep = [
                "--SocialCalcSpreadsheetControlSave",
                "Content-type: text/plain; charset=UTF-8",
                ""
        ].join("\n");

        /* TODO: the other parts */
        var meta = [
                "# SocialCalc Spreadsheet Control Save",
                "part:sheet"
        ].join("\n");

        var end = "--SocialCalcSpreadsheetControlSave--";

        var scencode = function(s) { return s.replace(/\\/g, "\\b").replace(/:/g, "\\c").replace(/\n/g,"\\n"); }

        var scsave = function scsave(ws) {
                if(!ws || !ws['!ref']) return "";
                var o = [], oo = [], cell, coord;
                var r = XLSX.utils.decode_range(ws['!ref']);
                for(var R = r.s.r; R <= r.e.r; ++R) {
                        for(var C = r.s.c; C <= r.e.c; ++C) {
                                coord = XLSX.utils.encode_cell({r:R,c:C});
                                if(!(cell = ws[coord]) || cell.v == null) continue;
                                oo = ["cell", coord, 't'];
                                switch(cell.t) {
                                        case 's': case 'str': oo.push(scencode(cell.v)); break;
                                        case 'n':
                                                if(cell.f) {
                                                        oo[2] = 'vtf';
                                                        oo.push('n');
                                                        oo.push(cell.v);
                                                        oo.push(scencode(cell.f));
                                                }
                                                else {
                                                        oo[2] = 'v';
                                                        oo.push(cell.v);
                                                } break;
                                }
                                o.push(oo.join(":"));
                        }
                }
                o.push("sheet:c:" + (r.e.c - r.s.c + 1) + ":r:" + (r.e.r - r.s.r + 1) + ":tvf:1");
                o.push("valueformat:1:text-wiki");
                o.push("copiedfrom:" + ws['!ref']);
                return o.join("\n");
        };

        return function socialcalcify(ws, opts) {
                return [header, sep, meta, sep, scsave(ws), end].join("\n");
        };
})();

var dropStatus = document.getElementById('ec-drop-status');
var dropRegion = document.getElementById('drop');
var DROP_IDLE_TEXT = dropStatus.textContent;

function setBusy(busy) {
	dropRegion.classList.toggle('ec-drop--busy', busy);
	if (busy) dropRegion.setAttribute('aria-busy', 'true');
	else dropRegion.removeAttribute('aria-busy');
	dropStatus.textContent = busy ? 'Working\u2026' : DROP_IDLE_TEXT;
}

function importFailed() {
	dropRegion.classList.remove('ec-drop--busy');
	dropRegion.removeAttribute('aria-busy');
	dropRegion.classList.add('ec-drop--error');
	dropStatus.textContent = 'Import failed \u2014 check the file and try again.';
}

function putSheet(id, contentType, body) {
	return fetch('./_/' + id, {
		method: 'PUT',
		headers: { 'content-type': contentType },
		body: body
	}).then(function (res) {
		if (!res.ok) throw new Error('PUT ' + id + ' \u2192 ' + res.status);
		return res;
	});
}

function process_wb(wb, id) {
	var output = "";
	if (wb.SheetNames.length > 1) {
		var toc = '"#url","#title"\n';
		var names = [].concat(wb.SheetNames);
		var idx = 0;
		var res = [];
		var sheetsToIdx = {}
		for (var i = 0; i < names.length; i++) {
			sheetsToIdx[names[i]] = i+1;
			res.push(names[i].replace(/'/g, "''").replace(/(\W)/g, '\\$1'));
		}
		var step = function(){
			if (names.length) {
				idx++;
				var k = names.shift();
				output = sheet_to_socialcalc(wb.Sheets[k]);
				toc += '"/' + id + '.' + idx + '",';
				toc += '"' + k.replace(/"/g, '""') + '"\n';
				output = output.replace(
					RegExp('(\'?)\\b(' + res.join('|') + ')\\1!', 'g'),
					function(_0, _1, ref){ return "'" + id + "." + sheetsToIdx[ref.replace(/''/g, "'")] + "'!"; }
				);
				putSheet(id + '.' + idx, 'text/x-socialcalc; charset=utf-8', output).then(step, importFailed);
			}
			else {
				putSheet(id, 'text/csv; charset=utf-8', toc).then(function () {
					location.href = './=' + id;
				}, importFailed);
			}
		};
		step();
		return;
	}
	output = sheet_to_socialcalc(wb.Sheets[wb.SheetNames[0]]);
	putSheet(id, 'text/x-socialcalc; charset=utf-8', output).then(function () {
		location.href = './' + id;
	}, importFailed);
}

function post_csv (csv, id) {
	putSheet(id, 'text/csv', csv).then(function () {
		location.href = './' + id;
	}, importFailed);
}

var BASE64URICHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('');
function newId (len, radix) {
    var chars = BASE64URICHARS, newId = [], i=0;
    radix = radix || chars.length;
    len = len || 22;

    for (i = 0; i < len; i++) newId[i] = chars[0 | Math.random()*radix];

    return newId.join('');
};

function get_id(file, checked) {
	if (checked) {
		var id = prompt("Enter a spreadsheet name for " + file + " (alphanumeric only)", "");
		// Cancel returns null; an empty or whitespace-only name would PUT
		// to ./_/ (no id). Both fall back to a random name.
		if (id !== null) {
			id = id.trim().toLowerCase().replace(/\s/g, "_");
			if (id) {
				// Named import can wipe an existing room: PUT /_/:room is a
				// destructive replace (API.md). Confirm before any putSheet.
				// Do not probe GET /_exists/:room — it is gated by
				// shouldDisableRoomIndex and 403s on default self-host.
				// Cancel aborts this file only (no silent random id).
				if (!confirm('A spreadsheet named "' + id + '" will be completely replaced if it already exists. Continue?')) {
					return null;
				}
				return id;
			}
		}
	}
	return newId(10, 36).toLowerCase();
}

var renameSheetCheckbox = document.getElementById('rename_sheet');

function importFiles(files) {
	if (!files || !files.length) return;
	dropRegion.classList.remove('ec-drop--error');
	setBusy(true);
	var started = 0;
	for (let i = 0; i != files.length; ++i) {
		const f = files[i];
		const reader = new FileReader();
		const name = f.name;
		const id = get_id(name, renameSheetCheckbox.checked);
		// null = user cancelled the named-import overwrite confirm.
		if (id === null) continue;
		started++;
		reader.onload = function(e) {
			// rABS path yields a binary string; the fallback yields an
			// ArrayBuffer. ZIP workbooks go directly to SheetJS: decoding a
			// large XLSX/ODS on the main thread just to identify it would add
			// a size-proportional allocation and block. CSV candidates alone
			// are UTF-8 decoded; the workbook path keeps the raw payload.
			var raw = e.target.result;
			if (isCsvCandidate(f, raw)) {
				return post_csv(utf8TextFromPayload(raw), id);
			}
			if(typeof Worker !== 'undefined') {
				xlsxworker(raw, process_wb, id);
			} else {
				var wb;
				if(rABS) {
					wb = XLSX.read(raw, {type: 'binary'});
				} else {
					wb = XLSX.read(btoa(fixdata(raw)), {type: 'base64'});
				}
				process_wb(wb, id);
			}
		};
		reader.onerror = importFailed;
		if(rABS) {
			reader.readAsBinaryString(f);
		} else {
			reader.readAsArrayBuffer(f);
		}
	}
	if (!started) setBusy(false);
}

function handleDrop(e) {
	e.stopPropagation();
	e.preventDefault();
	dropRegion.classList.remove('ec-drop--over');
	importFiles(e.dataTransfer.files);
}

function handleDragover(e) {
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
	dropRegion.classList.add('ec-drop--over');
}

if(dropRegion.addEventListener) {
	dropRegion.addEventListener('dragenter', handleDragover, false);
	dropRegion.addEventListener('dragover', handleDragover, false);
	dropRegion.addEventListener('dragleave', function () {
		dropRegion.classList.remove('ec-drop--over');
	}, false);
	dropRegion.addEventListener('drop', handleDrop, false);
}

document.getElementById('ec-file-input').addEventListener('change', function () {
	importFiles(this.files);
	this.value = '';
});
