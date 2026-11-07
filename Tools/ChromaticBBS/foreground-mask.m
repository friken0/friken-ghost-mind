#import <CoreImage/CoreImage.h>
#import <Vision/Vision.h>

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc < 3) {
            fputs("usage: foreground-mask PHOTO MASK.png [INSTANCE_ID ...]\n", stderr);
            return 2;
        }
        NSURL *input = [NSURL fileURLWithPath:@(argv[1])];
        NSURL *output = [NSURL fileURLWithPath:@(argv[2])];
        NSError *error = nil;
        CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)input, NULL);
        if (!source) { fputs("Cannot open photo\n", stderr); return 1; }
        NSDictionary *metadata = CFBridgingRelease(CGImageSourceCopyPropertiesAtIndex(source, 0, NULL));
        CGImagePropertyOrientation orientation = [metadata[(__bridge NSString *)kCGImagePropertyOrientation] intValue] ?: kCGImagePropertyOrientationUp;
        CFRelease(source);
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithURL:input orientation:orientation options:@{}];
        VNGenerateForegroundInstanceMaskRequest *request = [VNGenerateForegroundInstanceMaskRequest new];
        if (![handler performRequests:@[request] error:&error]) {
            NSLog(@"%@", error);
            return 1;
        }
        VNInstanceMaskObservation *observation = request.results.firstObject;
        NSIndexSet *available = observation.allInstances;
        NSMutableIndexSet *selected = [NSMutableIndexSet indexSet];
        for (int i = 3; i < argc; i++) {
            NSInteger id = [@(argv[i]) integerValue];
            if (id <= 0 || ![available containsIndex:id]) {
                NSLog(@"Unknown foreground instance %s. Available %@", argv[i], available);
                return 1;
            }
            [selected addIndex:id];
        }
        if (argc == 3 && available.count) [selected addIndexes:available];
        if (!selected.count) { fputs("No foreground instances found\n", stderr); return 1; }
        CVPixelBufferRef buffer = [observation generateScaledMaskForImageForInstances:selected
                                                                  fromRequestHandler:handler error:&error];
        if (!buffer) { NSLog(@"%@", error); return 1; }
        CIImage *image = [CIImage imageWithCVPixelBuffer:buffer];
        CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
        BOOL ok = [[CIContext context] writePNGRepresentationOfImage:image toURL:output format:kCIFormatRGBA8
                                                          colorSpace:colorSpace options:@{} error:&error];
        CGColorSpaceRelease(colorSpace);
        CVPixelBufferRelease(buffer);
        if (!ok) { NSLog(@"%@", error); return 1; }
        NSLog(@"Detected %@, used %@", available, selected);
        return 0;
    }
}
