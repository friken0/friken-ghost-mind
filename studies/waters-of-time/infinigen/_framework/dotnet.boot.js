export const config = /*json-start*/{
  "mainAssemblyName": "InfiniGenAudio.dll",
  "resources": {
    "hash": "sha256-yOYrWLfNcFKZropWWYgIU2S4nqa2j8xwPo59n+G70ok=",
    "jsModuleNative": [
      {
        "name": "dotnet.native.js"
      }
    ],
    "jsModuleRuntime": [
      {
        "name": "dotnet.runtime.js"
      }
    ],
    "wasmNative": [
      {
        "name": "dotnet.native.wasm",
        "integrity": "sha256-aTU85I5mhl1ohxdm8GFOQ5RNKFGyAVEYjz/YsPt1rO0="
      }
    ],
    "coreAssembly": [
      {
        "virtualPath": "InfiniGenAudio.wasm",
        "name": "InfiniGenAudio.wasm",
        "integrity": "sha256-jHgV8LCpw2muB7R4nUCFBVouhxHyTIXWJlyQeY/J6Bo="
      },
      {
        "virtualPath": "System.Collections.Concurrent.wasm",
        "name": "System.Collections.Concurrent.wasm",
        "integrity": "sha256-nxdZ62CqOZn8bNPj/X3xzGhtURQEcXU3DqwWz17lID8="
      },
      {
        "virtualPath": "System.Collections.wasm",
        "name": "System.Collections.wasm",
        "integrity": "sha256-hAkD60YQvpkwEcyD+Z0KFxiNfwW8InaxBfsewB+Ny4g="
      },
      {
        "virtualPath": "System.Console.wasm",
        "name": "System.Console.wasm",
        "integrity": "sha256-scReTU7Xmz5TIgHfNgJzF1cFjvVYMat9cF7uS1fw0Xg="
      },
      {
        "virtualPath": "System.IO.Pipelines.wasm",
        "name": "System.IO.Pipelines.wasm",
        "integrity": "sha256-ybH+sm0M8AtVcGVSt7C5l6WYbkAVqPv9y8rjm7FFjH8="
      },
      {
        "virtualPath": "System.Linq.wasm",
        "name": "System.Linq.wasm",
        "integrity": "sha256-Gk5VuIaPqOCaCCsTBqWbaWOwJtB3iz0Z5C4BU3bInsw="
      },
      {
        "virtualPath": "System.Memory.wasm",
        "name": "System.Memory.wasm",
        "integrity": "sha256-I3cjVZRaM6k7Y5szeO3b4VGPg9ua1vlP3RACLx4NdeQ="
      },
      {
        "virtualPath": "System.Private.CoreLib.wasm",
        "name": "System.Private.CoreLib.wasm",
        "integrity": "sha256-mYUrHHqr8R6Ppra0tcTYMI8aySfbAb3H2B0evrT4yWU="
      },
      {
        "virtualPath": "System.Private.Uri.wasm",
        "name": "System.Private.Uri.wasm",
        "integrity": "sha256-TS7lUitzF8FY6UxeK7UKrmywtjLYFsiidFVX1bcZf8o="
      },
      {
        "virtualPath": "System.Runtime.wasm",
        "name": "System.Runtime.wasm",
        "integrity": "sha256-fJ04ALuziMFPrCLDfPaXbkYAUwAZiBiMay+OYHM6xEs="
      },
      {
        "virtualPath": "System.Runtime.InteropServices.JavaScript.wasm",
        "name": "System.Runtime.InteropServices.JavaScript.wasm",
        "integrity": "sha256-wWax10/CYfF16Q3O5fRfHf2BajnrwamrLvz9DCyC3ZM="
      },
      {
        "virtualPath": "System.Security.Cryptography.wasm",
        "name": "System.Security.Cryptography.wasm",
        "integrity": "sha256-g+PSEkvrxMN6pb+L46lq/GAJySfDT87GHj+vWx4IP/0="
      },
      {
        "virtualPath": "System.Text.Encodings.Web.wasm",
        "name": "System.Text.Encodings.Web.wasm",
        "integrity": "sha256-3yaisy4Oi9udlE4vSIiTc98V/0Yf6udYdwfYIIOhOCQ="
      },
      {
        "virtualPath": "System.Text.Json.wasm",
        "name": "System.Text.Json.wasm",
        "integrity": "sha256-0/91XtF7EBXnQeijFj2dyTY/9DPvPEqmd7b+nqjCkVc="
      },
      {
        "virtualPath": "System.Text.RegularExpressions.wasm",
        "name": "System.Text.RegularExpressions.wasm",
        "integrity": "sha256-OpA06k9zFaFiHZm8DItYc89bY+6Nz2kit3gy6hiJjvU="
      },
      {
        "virtualPath": "System.Threading.wasm",
        "name": "System.Threading.wasm",
        "integrity": "sha256-gdmJLI1Rwh9iFkyl4IlgfABPyKoa4QmnCI6Qn+qmFgc="
      }
    ],
    "assembly": []
  },
  "debugLevel": 0,
  "globalizationMode": "invariant",
  "runtimeConfig": {
    "runtimeOptions": {
      "configProperties": {
        "Microsoft.Extensions.DependencyInjection.VerifyOpenGenericServiceTrimmability": true,
        "System.ComponentModel.DefaultValueAttribute.IsSupported": false,
        "System.ComponentModel.Design.IDesignerHost.IsSupported": false,
        "System.ComponentModel.TypeConverter.EnableUnsafeBinaryFormatterInDesigntimeLicenseContextSerialization": false,
        "System.ComponentModel.TypeDescriptor.IsComObjectDescriptorSupported": false,
        "System.Data.DataSet.XmlSerializationIsSupported": false,
        "System.Diagnostics.Debugger.IsSupported": false,
        "System.Diagnostics.Metrics.Meter.IsSupported": false,
        "System.Diagnostics.Tracing.EventSource.IsSupported": false,
        "System.Globalization.Invariant": true,
        "System.TimeZoneInfo.Invariant": false,
        "System.Globalization.PredefinedCulturesOnly": true,
        "System.Linq.Enumerable.IsSizeOptimized": true,
        "System.Net.Http.EnableActivityPropagation": false,
        "System.Net.Http.WasmEnableStreamingResponse": true,
        "System.Net.SocketsHttpHandler.Http3Support": false,
        "System.Reflection.Metadata.MetadataUpdater.IsSupported": false,
        "System.Resources.ResourceManager.AllowCustomResourceTypes": false,
        "System.Resources.UseSystemResourceKeys": true,
        "System.Runtime.CompilerServices.RuntimeFeature.IsDynamicCodeSupported": true,
        "System.Runtime.InteropServices.BuiltInComInterop.IsSupported": false,
        "System.Runtime.InteropServices.EnableConsumingManagedCodeFromNativeHosting": false,
        "System.Runtime.InteropServices.EnableCppCLIHostActivation": false,
        "System.Runtime.InteropServices.Marshalling.EnableGeneratedComInterfaceComImportInterop": false,
        "System.Runtime.Serialization.EnableUnsafeBinaryFormatterSerialization": false,
        "System.StartupHookProvider.IsSupported": false,
        "System.Text.Encoding.EnableUnsafeUTF7Encoding": false,
        "System.Text.Json.JsonSerializer.IsReflectionEnabledByDefault": true,
        "System.Threading.Thread.EnableAutoreleasePool": false
      }
    }
  }
}/*json-end*/;