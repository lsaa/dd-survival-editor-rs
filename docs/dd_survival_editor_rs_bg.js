import { save_file } from 'js/save_file.js';
import * as wasm from './dd_survival_editor_rs_bg.wasm';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachegetFloat64Memory0 = null;
function getFloat64Memory0() {
    if (cachegetFloat64Memory0 === null || cachegetFloat64Memory0.buffer !== wasm.memory.buffer) {
        cachegetFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachegetFloat64Memory0;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_24(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h73a3bdb1c48e0d8b(arg0, arg1);
}

function __wbg_adapter_27(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__haf1d3b200386b85e(arg0, arg1);
}

function __wbg_adapter_30(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h2a07ccebddf420eb(arg0, arg1);
}

function __wbg_adapter_33(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_36(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_39(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_42(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_45(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_48(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_51(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__heb4948f96a8a5639(arg0, arg1);
}

function __wbg_adapter_54(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_57(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3a66c79301c43bd7(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_60(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hf1dd56d6844ff553(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {string} canvas_id
*/
export function start(canvas_id) {
    var ptr0 = passStringToWasm0(canvas_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.start(ptr0, len0);
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_482(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h1bf68ca74508ed22(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

export function __wbg_savefile_267cd794333a56d1(arg0, arg1, arg2) {
    try {
        save_file(getStringFromWasm0(arg0, arg1), takeObject(arg2));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    var ret = false;
    return ret;
};

export function __wbindgen_object_clone_ref(arg0) {
    var ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_string_new(arg0, arg1) {
    var ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    var ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbg_instanceof_WebGl2RenderingContext_56ad96bfac3f5531(arg0) {
    var ret = getObject(arg0) instanceof WebGL2RenderingContext;
    return ret;
};

export function __wbg_drawingBufferWidth_561b8beaef3111f5(arg0) {
    var ret = getObject(arg0).drawingBufferWidth;
    return ret;
};

export function __wbg_drawingBufferHeight_aa35759c7f962358(arg0) {
    var ret = getObject(arg0).drawingBufferHeight;
    return ret;
};

export function __wbg_bindVertexArray_52b8b2f5fd93d81d(arg0, arg1) {
    getObject(arg0).bindVertexArray(getObject(arg1));
};

export function __wbg_bufferData_bba22fbe5dd1f1d6(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
};

export function __wbg_bufferData_794d61d3c392fafd(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0);
};

export function __wbg_createVertexArray_d59135c0a43c410b(arg0) {
    var ret = getObject(arg0).createVertexArray();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_deleteVertexArray_385874f9e1499a3f(arg0, arg1) {
    getObject(arg0).deleteVertexArray(getObject(arg1));
};

export function __wbg_texImage2D_29ea0a7f026e239b() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
}, arguments) };

export function __wbg_activeTexture_0092956fa2eefd8c(arg0, arg1) {
    getObject(arg0).activeTexture(arg1 >>> 0);
};

export function __wbg_attachShader_7faccaa7b5ac28a6(arg0, arg1, arg2) {
    getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
};

export function __wbg_bindBuffer_4ece833dd10cac2f(arg0, arg1, arg2) {
    getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindFramebuffer_48c4bf8ff82bf7e9(arg0, arg1, arg2) {
    getObject(arg0).bindFramebuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindTexture_9d8ed0fcd83eb0a9(arg0, arg1, arg2) {
    getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
};

export function __wbg_blendFunc_b254bb91838df1dd(arg0, arg1, arg2) {
    getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_clear_4ce66c813d66e77d(arg0, arg1) {
    getObject(arg0).clear(arg1 >>> 0);
};

export function __wbg_clearColor_71f96fd72a7646a6(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearColor(arg1, arg2, arg3, arg4);
};

export function __wbg_compileShader_dd66d66a5a6481f3(arg0, arg1) {
    getObject(arg0).compileShader(getObject(arg1));
};

export function __wbg_createBuffer_5c5caa16032a81b7(arg0) {
    var ret = getObject(arg0).createBuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createFramebuffer_9818fc04b4a38c18(arg0) {
    var ret = getObject(arg0).createFramebuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createProgram_32d01a55e144b9fc(arg0) {
    var ret = getObject(arg0).createProgram();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createShader_6e8eed55567fe1a6(arg0, arg1) {
    var ret = getObject(arg0).createShader(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createTexture_8f31e7386e22fc37(arg0) {
    var ret = getObject(arg0).createTexture();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_deleteBuffer_de80b51d8166fddb(arg0, arg1) {
    getObject(arg0).deleteBuffer(getObject(arg1));
};

export function __wbg_deleteFramebuffer_5f58ccb548438c57(arg0, arg1) {
    getObject(arg0).deleteFramebuffer(getObject(arg1));
};

export function __wbg_deleteProgram_3ec3c43f2cddde7f(arg0, arg1) {
    getObject(arg0).deleteProgram(getObject(arg1));
};

export function __wbg_deleteTexture_a0632c71429795ac(arg0, arg1) {
    getObject(arg0).deleteTexture(getObject(arg1));
};

export function __wbg_disable_b05e075ae54fa448(arg0, arg1) {
    getObject(arg0).disable(arg1 >>> 0);
};

export function __wbg_drawElements_a41bb53d39cd6297(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
};

export function __wbg_enable_766e546395da5a5d(arg0, arg1) {
    getObject(arg0).enable(arg1 >>> 0);
};

export function __wbg_enableVertexAttribArray_91da8d3cbe0c2bbd(arg0, arg1) {
    getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
};

export function __wbg_framebufferTexture2D_3da41a7f38e2c523(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5);
};

export function __wbg_getAttribLocation_5d304d390c7273f5(arg0, arg1, arg2, arg3) {
    var ret = getObject(arg0).getAttribLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return ret;
};

export function __wbg_getProgramInfoLog_18c849a5fa54e7b1(arg0, arg1, arg2) {
    var ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getProgramParameter_80edd3cfbcf7cf1d(arg0, arg1, arg2) {
    var ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getShaderInfoLog_ba1de20c14b6fb63(arg0, arg1, arg2) {
    var ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getShaderParameter_264d9ab5c13ece4d(arg0, arg1, arg2) {
    var ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getUniformLocation_77b2d89291f84289(arg0, arg1, arg2, arg3) {
    var ret = getObject(arg0).getUniformLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_linkProgram_b84796e37364e5c9(arg0, arg1) {
    getObject(arg0).linkProgram(getObject(arg1));
};

export function __wbg_pixelStorei_a9b9b42ef01616b2(arg0, arg1, arg2) {
    getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
};

export function __wbg_scissor_5802aaee71f2eb0e(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).scissor(arg1, arg2, arg3, arg4);
};

export function __wbg_shaderSource_18f45f93c05a8311(arg0, arg1, arg2, arg3) {
    getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
};

export function __wbg_texParameteri_c54aab65b2f8cf6d(arg0, arg1, arg2, arg3) {
    getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
};

export function __wbg_uniform1i_e287345af4468e22(arg0, arg1, arg2) {
    getObject(arg0).uniform1i(getObject(arg1), arg2);
};

export function __wbg_uniform2f_f8d8e7662e0e0eb6(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2f(getObject(arg1), arg2, arg3);
};

export function __wbg_useProgram_c2fdf4a953d1128a(arg0, arg1) {
    getObject(arg0).useProgram(getObject(arg1));
};

export function __wbg_vertexAttribPointer_76d558694fe81cd7(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
};

export function __wbg_viewport_da0901eee69b9909(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).viewport(arg1, arg2, arg3, arg4);
};

export function __wbg_instanceof_Window_c4b70662a0d2c5ec(arg0) {
    var ret = getObject(arg0) instanceof Window;
    return ret;
};

export function __wbg_document_1c64944725c0d81d(arg0) {
    var ret = getObject(arg0).document;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_location_f98ad02632f88c43(arg0) {
    var ret = getObject(arg0).location;
    return addHeapObject(ret);
};

export function __wbg_navigator_480e592af6ad365b(arg0) {
    var ret = getObject(arg0).navigator;
    return addHeapObject(ret);
};

export function __wbg_innerWidth_ef25c730fca132cf() { return handleError(function (arg0) {
    var ret = getObject(arg0).innerWidth;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_innerHeight_1b1217a63a77bf61() { return handleError(function (arg0) {
    var ret = getObject(arg0).innerHeight;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_devicePixelRatio_d8c3852bb37f76bf(arg0) {
    var ret = getObject(arg0).devicePixelRatio;
    return ret;
};

export function __wbg_performance_947628766699c5bb(arg0) {
    var ret = getObject(arg0).performance;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_localStorage_6775414303ab5085() { return handleError(function (arg0) {
    var ret = getObject(arg0).localStorage;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_matchMedia_b95c474c6db67a60() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).matchMedia(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_open_5416e4448a959cfa() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    var ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_requestAnimationFrame_71638ca922068239() { return handleError(function (arg0, arg1) {
    var ret = getObject(arg0).requestAnimationFrame(getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_setInterval_ec2d9dc4a54a6566() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).setInterval(getObject(arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_setTimeout_df66d951b1726b78() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_items_0e0d8664cb0c227c(arg0) {
    var ret = getObject(arg0).items;
    return addHeapObject(ret);
};

export function __wbg_files_d148fafe4f8ef096(arg0) {
    var ret = getObject(arg0).files;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_getData_a4934f84b4074e8b() { return handleError(function (arg0, arg1, arg2, arg3) {
    var ret = getObject(arg1).getData(getStringFromWasm0(arg2, arg3));
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}, arguments) };

export function __wbg_length_b3892c671bcff0a9(arg0) {
    var ret = getObject(arg0).length;
    return ret;
};

export function __wbg_get_eb708b1d3ad92ce5(arg0, arg1) {
    var ret = getObject(arg0)[arg1 >>> 0];
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_matches_76fae292b8cd60a6(arg0) {
    var ret = getObject(arg0).matches;
    return ret;
};

export function __wbg_now_559193109055ebad(arg0) {
    var ret = getObject(arg0).now();
    return ret;
};

export function __wbg_identifier_87ee1c4654593a75(arg0) {
    var ret = getObject(arg0).identifier;
    return ret;
};

export function __wbg_pageX_e47dc88281930930(arg0) {
    var ret = getObject(arg0).pageX;
    return ret;
};

export function __wbg_pageY_b6b579adcea2948f(arg0) {
    var ret = getObject(arg0).pageY;
    return ret;
};

export function __wbg_force_c47d39a3ad56c12f(arg0) {
    var ret = getObject(arg0).force;
    return ret;
};

export function __wbg_type_7a49279491e15d0a(arg0, arg1) {
    var ret = getObject(arg1).type;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_preventDefault_9866c9fd51eecfb6(arg0) {
    getObject(arg0).preventDefault();
};

export function __wbg_stopPropagation_ae76be6b0f664ee8(arg0) {
    getObject(arg0).stopPropagation();
};

export function __wbg_name_6af1a38f3edc1522(arg0, arg1) {
    var ret = getObject(arg1).name;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_lastModified_c61609c3c6a0bd88(arg0) {
    var ret = getObject(arg0).lastModified;
    return ret;
};

export function __wbg_length_a2870b8b80e120c3(arg0) {
    var ret = getObject(arg0).length;
    return ret;
};

export function __wbg_get_b84d80d476cf15e4(arg0, arg1) {
    var ret = getObject(arg0)[arg1 >>> 0];
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_keyCode_490ed69472addfdc(arg0) {
    var ret = getObject(arg0).keyCode;
    return ret;
};

export function __wbg_altKey_3dcb50d5afbc5036(arg0) {
    var ret = getObject(arg0).altKey;
    return ret;
};

export function __wbg_ctrlKey_fb62ba10b63b34a4(arg0) {
    var ret = getObject(arg0).ctrlKey;
    return ret;
};

export function __wbg_shiftKey_bd2875540e5db840(arg0) {
    var ret = getObject(arg0).shiftKey;
    return ret;
};

export function __wbg_metaKey_94ca09e07f21f240(arg0) {
    var ret = getObject(arg0).metaKey;
    return ret;
};

export function __wbg_isComposing_d05ebca75d81bc30(arg0) {
    var ret = getObject(arg0).isComposing;
    return ret;
};

export function __wbg_key_10dcaa4bb6d5449f(arg0, arg1) {
    var ret = getObject(arg1).key;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_length_1d27563e3515722e(arg0) {
    var ret = getObject(arg0).length;
    return ret;
};

export function __wbg_item_a23b382195352a8a(arg0, arg1) {
    var ret = getObject(arg0).item(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_get_20b719b18767c76e(arg0, arg1) {
    var ret = getObject(arg0)[arg1 >>> 0];
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_instanceof_HtmlCanvasElement_25d964a0dde6717e(arg0) {
    var ret = getObject(arg0) instanceof HTMLCanvasElement;
    return ret;
};

export function __wbg_width_555f63ab09ba7d3f(arg0) {
    var ret = getObject(arg0).width;
    return ret;
};

export function __wbg_setwidth_c1a7061891b71f25(arg0, arg1) {
    getObject(arg0).width = arg1 >>> 0;
};

export function __wbg_height_7153faec70fbaf7b(arg0) {
    var ret = getObject(arg0).height;
    return ret;
};

export function __wbg_setheight_88894b05710ff752(arg0, arg1) {
    getObject(arg0).height = arg1 >>> 0;
};

export function __wbg_getContext_f701d0231ae22393() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_touches_3bcd168150040d19(arg0) {
    var ret = getObject(arg0).touches;
    return addHeapObject(ret);
};

export function __wbg_changedTouches_d84714496e7f4712(arg0) {
    var ret = getObject(arg0).changedTouches;
    return addHeapObject(ret);
};

export function __wbg_top_3946f8347860b55c(arg0) {
    var ret = getObject(arg0).top;
    return ret;
};

export function __wbg_left_31cce57341292712(arg0) {
    var ret = getObject(arg0).left;
    return ret;
};

export function __wbg_clipboard_3dff7cff084c4be2(arg0) {
    var ret = getObject(arg0).clipboard;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_userAgent_bdd46cceef222f52() { return handleError(function (arg0, arg1) {
    var ret = getObject(arg1).userAgent;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}, arguments) };

export function __wbg_appendChild_d318db34c4559916() { return handleError(function (arg0, arg1) {
    var ret = getObject(arg0).appendChild(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getItem_77fb9d4666f3b93a() { return handleError(function (arg0, arg1, arg2, arg3) {
    var ret = getObject(arg1).getItem(getStringFromWasm0(arg2, arg3));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}, arguments) };

export function __wbg_setItem_b0c4561489dffecd() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setItem(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_size_3d49b94127cdd6ed(arg0) {
    var ret = getObject(arg0).size;
    return ret;
};

export function __wbg_new_fae91b08e0bf252a() { return handleError(function () {
    var ret = new Blob();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_arrayBuffer_e857fb358de5f814(arg0) {
    var ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
};

export function __wbg_data_dbff09eb89176161(arg0, arg1) {
    var ret = getObject(arg1).data;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_setProperty_1460c660bc329763() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_type_a6fcda966902940d(arg0, arg1) {
    var ret = getObject(arg1).type;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_hash_0fff5255cf3c317c() { return handleError(function (arg0, arg1) {
    var ret = getObject(arg1).hash;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}, arguments) };

export function __wbg_body_78ae4fd43b446013(arg0) {
    var ret = getObject(arg0).body;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createElement_86c152812a141a62() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getElementById_f3e94458ce77f0d0(arg0, arg1, arg2) {
    var ret = getObject(arg0).getElementById(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_setid_681bb5a14c3d5850(arg0, arg1, arg2) {
    getObject(arg0).id = getStringFromWasm0(arg1, arg2);
};

export function __wbg_scrollLeft_e79152b1f5d86671(arg0) {
    var ret = getObject(arg0).scrollLeft;
    return ret;
};

export function __wbg_setinnerHTML_e5b817d6227a431c(arg0, arg1, arg2) {
    getObject(arg0).innerHTML = getStringFromWasm0(arg1, arg2);
};

export function __wbg_getBoundingClientRect_2fba0402ea2a6ec4(arg0) {
    var ret = getObject(arg0).getBoundingClientRect();
    return addHeapObject(ret);
};

export function __wbg_remove_c63cabc94a77cacb(arg0) {
    getObject(arg0).remove();
};

export function __wbg_instanceof_WebGlRenderingContext_101b938bec1286a3(arg0) {
    var ret = getObject(arg0) instanceof WebGLRenderingContext;
    return ret;
};

export function __wbg_drawingBufferWidth_8b0c2b31d9d6eee7(arg0) {
    var ret = getObject(arg0).drawingBufferWidth;
    return ret;
};

export function __wbg_drawingBufferHeight_f62678018bab567c(arg0) {
    var ret = getObject(arg0).drawingBufferHeight;
    return ret;
};

export function __wbg_bufferData_6beb22ecb30c1316(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
};

export function __wbg_bufferData_2f9be23b37e5a1a4(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0);
};

export function __wbg_texImage2D_712c56fe5a9825ed() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
}, arguments) };

export function __wbg_activeTexture_b34aca0c2110966c(arg0, arg1) {
    getObject(arg0).activeTexture(arg1 >>> 0);
};

export function __wbg_attachShader_eaa824fd5b37a770(arg0, arg1, arg2) {
    getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
};

export function __wbg_bindBuffer_2ca7e1c18819ecb2(arg0, arg1, arg2) {
    getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindFramebuffer_c9f468afa9d42a5f(arg0, arg1, arg2) {
    getObject(arg0).bindFramebuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindTexture_edd827f3dba6038e(arg0, arg1, arg2) {
    getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
};

export function __wbg_blendFunc_d5ab9f0ff5a40a48(arg0, arg1, arg2) {
    getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_clear_da26620d46f0a11a(arg0, arg1) {
    getObject(arg0).clear(arg1 >>> 0);
};

export function __wbg_clearColor_cbf22f8faa5a52c1(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearColor(arg1, arg2, arg3, arg4);
};

export function __wbg_compileShader_8fb70a472f32552c(arg0, arg1) {
    getObject(arg0).compileShader(getObject(arg1));
};

export function __wbg_createBuffer_4802e2f0e1b1acdf(arg0) {
    var ret = getObject(arg0).createBuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createFramebuffer_0157699cdc720b46(arg0) {
    var ret = getObject(arg0).createFramebuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createProgram_b1d94f4c7554d3a1(arg0) {
    var ret = getObject(arg0).createProgram();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createShader_da09e167692f0dc7(arg0, arg1) {
    var ret = getObject(arg0).createShader(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createTexture_bafc7c08393ae59d(arg0) {
    var ret = getObject(arg0).createTexture();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_deleteBuffer_9c31f3452ba32db1(arg0, arg1) {
    getObject(arg0).deleteBuffer(getObject(arg1));
};

export function __wbg_deleteFramebuffer_0f43513bd6c6d986(arg0, arg1) {
    getObject(arg0).deleteFramebuffer(getObject(arg1));
};

export function __wbg_deleteProgram_a2c849932f79e7af(arg0, arg1) {
    getObject(arg0).deleteProgram(getObject(arg1));
};

export function __wbg_deleteTexture_82d755a5ac828346(arg0, arg1) {
    getObject(arg0).deleteTexture(getObject(arg1));
};

export function __wbg_disable_b07faddb7d04349f(arg0, arg1) {
    getObject(arg0).disable(arg1 >>> 0);
};

export function __wbg_drawElements_8e8af4b6757fedce(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
};

export function __wbg_enable_d3d210aeb08eff52(arg0, arg1) {
    getObject(arg0).enable(arg1 >>> 0);
};

export function __wbg_enableVertexAttribArray_d539e547495bea44(arg0, arg1) {
    getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
};

export function __wbg_framebufferTexture2D_923c6fc6645661bc(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5);
};

export function __wbg_getAttribLocation_706a0beabcdaebcf(arg0, arg1, arg2, arg3) {
    var ret = getObject(arg0).getAttribLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return ret;
};

export function __wbg_getExtension_045789240c50a108() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).getExtension(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_getProgramInfoLog_b60e82d52c200cbd(arg0, arg1, arg2) {
    var ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getProgramParameter_229c193895936bbe(arg0, arg1, arg2) {
    var ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getShaderInfoLog_ba51160c01b98360(arg0, arg1, arg2) {
    var ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getShaderParameter_dadc55c10928575d(arg0, arg1, arg2) {
    var ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getUniformLocation_c3b3570b4632cc5c(arg0, arg1, arg2, arg3) {
    var ret = getObject(arg0).getUniformLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_linkProgram_7080c84b0233cea2(arg0, arg1) {
    getObject(arg0).linkProgram(getObject(arg1));
};

export function __wbg_pixelStorei_3cd96723ae22a5c6(arg0, arg1, arg2) {
    getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
};

export function __wbg_scissor_35fe98c7da06091c(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).scissor(arg1, arg2, arg3, arg4);
};

export function __wbg_shaderSource_67b991301db003d0(arg0, arg1, arg2, arg3) {
    getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
};

export function __wbg_texParameteri_bd724f6a5ad0cbbc(arg0, arg1, arg2, arg3) {
    getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
};

export function __wbg_uniform1i_0811c29c0eebe191(arg0, arg1, arg2) {
    getObject(arg0).uniform1i(getObject(arg1), arg2);
};

export function __wbg_uniform2f_c4c110dee7f069e7(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2f(getObject(arg1), arg2, arg3);
};

export function __wbg_useProgram_b72b0bfcbc720fa9(arg0, arg1) {
    getObject(arg0).useProgram(getObject(arg1));
};

export function __wbg_vertexAttribPointer_b5cb524c6fe9eec8(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
};

export function __wbg_viewport_89af3aceb7036a2c(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).viewport(arg1, arg2, arg3, arg4);
};

export function __wbg_error_cc38ce2b4b661e1d(arg0) {
    console.error(getObject(arg0));
};

export function __wbg_log_3445347661d4505e(arg0) {
    console.log(getObject(arg0));
};

export function __wbg_warn_5ec7c7c02d0b3841(arg0) {
    console.warn(getObject(arg0));
};

export function __wbg_scrollTop_14114fee3506489f(arg0) {
    var ret = getObject(arg0).scrollTop;
    return ret;
};

export function __wbg_setinnerText_4f4ec715a9a131a0(arg0, arg1, arg2) {
    getObject(arg0).innerText = getStringFromWasm0(arg1, arg2);
};

export function __wbg_hidden_cf2bd9859a26899c(arg0) {
    var ret = getObject(arg0).hidden;
    return ret;
};

export function __wbg_sethidden_8e35dd2030c5f20a(arg0, arg1) {
    getObject(arg0).hidden = arg1 !== 0;
};

export function __wbg_style_c88e323890d3a091(arg0) {
    var ret = getObject(arg0).style;
    return addHeapObject(ret);
};

export function __wbg_offsetTop_83b2934370041fae(arg0) {
    var ret = getObject(arg0).offsetTop;
    return ret;
};

export function __wbg_offsetLeft_d6d050965faa87a8(arg0) {
    var ret = getObject(arg0).offsetLeft;
    return ret;
};

export function __wbg_offsetWidth_69cd6669725b154f(arg0) {
    var ret = getObject(arg0).offsetWidth;
    return ret;
};

export function __wbg_setonclick_8da32c8c00a7359b(arg0, arg1) {
    getObject(arg0).onclick = getObject(arg1);
};

export function __wbg_blur_0bae1ed9ffb0b918() { return handleError(function (arg0) {
    getObject(arg0).blur();
}, arguments) };

export function __wbg_focus_00530e359f44fc6e() { return handleError(function (arg0) {
    getObject(arg0).focus();
}, arguments) };

export function __wbg_writeText_3b86a6dbc18b261b(arg0, arg1, arg2) {
    var ret = getObject(arg0).writeText(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
};

export function __wbg_clipboardData_d717f7cf398c0dd9(arg0) {
    var ret = getObject(arg0).clipboardData;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_instanceof_HtmlButtonElement_54060a3d8d49c8a6(arg0) {
    var ret = getObject(arg0) instanceof HTMLButtonElement;
    return ret;
};

export function __wbg_clientX_97ff0f5c7b19e687(arg0) {
    var ret = getObject(arg0).clientX;
    return ret;
};

export function __wbg_clientY_cacd4a7e44b9719b(arg0) {
    var ret = getObject(arg0).clientY;
    return ret;
};

export function __wbg_ctrlKey_9761d22fa42f09c0(arg0) {
    var ret = getObject(arg0).ctrlKey;
    return ret;
};

export function __wbg_metaKey_e6b9e0aa35aa2974(arg0) {
    var ret = getObject(arg0).metaKey;
    return ret;
};

export function __wbg_button_a02c0467d38e8338(arg0) {
    var ret = getObject(arg0).button;
    return ret;
};

export function __wbg_deltaX_8cfc6cd15e97d97c(arg0) {
    var ret = getObject(arg0).deltaX;
    return ret;
};

export function __wbg_deltaY_080604c20160c0e8(arg0) {
    var ret = getObject(arg0).deltaY;
    return ret;
};

export function __wbg_deltaMode_c5ec1ee518ea0a08(arg0) {
    var ret = getObject(arg0).deltaMode;
    return ret;
};

export function __wbg_dataTransfer_ebba35c1049e694f(arg0) {
    var ret = getObject(arg0).dataTransfer;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_addEventListener_52721772cc0a7f30() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
}, arguments) };

export function __wbg_result_f585a3158755ae13() { return handleError(function (arg0) {
    var ret = getObject(arg0).result;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_setonload_fbba17a1da89a2b2(arg0, arg1) {
    getObject(arg0).onload = getObject(arg1);
};

export function __wbg_new_d324bc8986123ab6() { return handleError(function () {
    var ret = new FileReader();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_readAsArrayBuffer_c8b57b0b0ff9a766() { return handleError(function (arg0, arg1) {
    getObject(arg0).readAsArrayBuffer(getObject(arg1));
}, arguments) };

export function __wbg_instanceof_HtmlInputElement_8cafe5f30dfdb6bc(arg0) {
    var ret = getObject(arg0) instanceof HTMLInputElement;
    return ret;
};

export function __wbg_setaccept_e53de14605da7924(arg0, arg1, arg2) {
    getObject(arg0).accept = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setautofocus_5d3aec51de5021e2(arg0, arg1) {
    getObject(arg0).autofocus = arg1 !== 0;
};

export function __wbg_files_a3fa7d3aaf57bbd2(arg0) {
    var ret = getObject(arg0).files;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_setmultiple_00b587f9cdafb61a(arg0, arg1) {
    getObject(arg0).multiple = arg1 !== 0;
};

export function __wbg_setsize_9ec16303ce038acb(arg0, arg1) {
    getObject(arg0).size = arg1 >>> 0;
};

export function __wbg_settype_6a7d0ca3b1b6d0c2(arg0, arg1, arg2) {
    getObject(arg0).type = getStringFromWasm0(arg1, arg2);
};

export function __wbg_value_0627d4b1c27534e6(arg0, arg1) {
    var ret = getObject(arg1).value;
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_setvalue_2459f62386b6967f(arg0, arg1, arg2) {
    getObject(arg0).value = getStringFromWasm0(arg1, arg2);
};

export function __wbg_newnoargs_be86524d73f67598(arg0, arg1) {
    var ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_888d259a5fefc347() { return handleError(function (arg0, arg1) {
    var ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_346669c262382ad7() { return handleError(function (arg0, arg1, arg2) {
    var ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_b1d61b5687f5e73a(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_482(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        var ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_d23068002f584f22(arg0) {
    var ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_2fcac196782070cc(arg0, arg1) {
    var ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_8c2d62e8ae5978f7(arg0, arg1, arg2) {
    var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_self_c6fbdfc2918d5e58() { return handleError(function () {
    var ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_baec038b5ab35c54() { return handleError(function () {
    var ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_3f735a5746d41fbd() { return handleError(function () {
    var ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_1bc0b39582740e95() { return handleError(function () {
    var ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    var ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_buffer_397eaa4d72ee94dd(arg0) {
    var ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_new_99c38feff948285c(arg0) {
    var ret = new Int16Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_new_a7ce447f15ff496f(arg0) {
    var ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_969ad0a60e51d320(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_1eb8fc608a0d4cdb(arg0) {
    var ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_8b45a9becdb89691(arg0) {
    var ret = new Float32Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_subarray_5208d7c1876d9ee7(arg0, arg1, arg2) {
    var ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_8b658422a224f479(arg0, arg1, arg2) {
    var ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_9e3273b330900f8c(arg0, arg1, arg2) {
    var ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_instanceof_Memory_625744f21df3a5ec(arg0) {
    var ret = getObject(arg0) instanceof WebAssembly.Memory;
    return ret;
};

export function __wbindgen_debug_string(arg0, arg1) {
    var ret = debugString(getObject(arg1));
    var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_rethrow(arg0) {
    throw takeObject(arg0);
};

export function __wbindgen_memory() {
    var ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper428(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 86, __wbg_adapter_24);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper539(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 130, __wbg_adapter_27);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper713(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_30);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper714(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_33);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper716(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_36);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper718(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_39);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper721(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_42);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper723(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_45);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper725(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_48);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper727(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_51);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper729(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_54);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper731(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 200, __wbg_adapter_57);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper851(arg0, arg1, arg2) {
    var ret = makeMutClosure(arg0, arg1, 267, __wbg_adapter_60);
    return addHeapObject(ret);
};

