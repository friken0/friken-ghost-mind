// Local inverse-depth inference with Apple's Depth Anything V2 Core ML model.
#import <CoreML/CoreML.h>
#import <CoreImage/CoreImage.h>
#import <Vision/Vision.h>

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 4) {
            fputs("usage: estimate-photo-depth MODEL.mlpackage ORIENTED_PHOTO DEPTH.png\n", stderr);
            return 2;
        }
        NSError *error = nil;
        NSURL *package = [NSURL fileURLWithPath:@(argv[1])];
        NSURL *compiled = [MLModel compileModelAtURL:package error:&error];
        if (!compiled) { NSLog(@"%@", error); return 1; }
        MLModelConfiguration *config = [MLModelConfiguration new];
        config.computeUnits = MLComputeUnitsCPUOnly;
        MLModel *model = [MLModel modelWithContentsOfURL:compiled configuration:config error:&error];
        VNCoreMLModel *vision = model ? [VNCoreMLModel modelForMLModel:model error:&error] : nil;
        if (!vision) { NSLog(@"%@", error); return 1; }
        MLImageConstraint *size = model.modelDescription.inputDescriptionsByName.allValues.firstObject.imageConstraint;
        CGImageSourceRef input = CGImageSourceCreateWithURL((__bridge CFURLRef)[NSURL fileURLWithPath:@(argv[2])], NULL);
        CGImageRef photo = input ? CGImageSourceCreateImageAtIndex(input, 0, NULL) : NULL;
        if (input) CFRelease(input);
        if (!photo || !size) { if (photo) CGImageRelease(photo); return 1; }
        size_t sourceW = CGImageGetWidth(photo), sourceH = CGImageGetHeight(photo);
        VNCoreMLRequest *request = [[VNCoreMLRequest alloc] initWithModel:vision];
        request.imageCropAndScaleOption = VNImageCropAndScaleOptionScaleFit;
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:photo options:@{}];
        CGImageRelease(photo);
        if (![handler performRequests:@[request] error:&error]) { NSLog(@"%@", error); return 1; }
        VNObservation *observation = request.results.firstObject;
        if (![observation isKindOfClass:VNPixelBufferObservation.class]) {
            NSLog(@"Expected image depth output, received %@", observation.class);
            return 1;
        }
        CVPixelBufferRef buffer = [(VNPixelBufferObservation *)observation pixelBuffer];
        size_t width = CVPixelBufferGetWidth(buffer), height = CVPixelBufferGetHeight(buffer);
        OSType format = CVPixelBufferGetPixelFormatType(buffer);
        if (format != kCVPixelFormatType_OneComponent16Half && format != kCVPixelFormatType_OneComponent32Float
            && format != kCVPixelFormatType_OneComponent8) {
            NSLog(@"Unsupported depth format %u", format); return 1;
        }
        double fit = fmin((double)size.pixelsWide/sourceW,(double)size.pixelsHigh/sourceH);
        size_t cropW = MIN(width, (size_t)round(sourceW*fit*width/size.pixelsWide));
        size_t cropH = MIN(height, (size_t)round(sourceH*fit*height/size.pixelsHigh));
        size_t x0 = (width-cropW)/2, y0 = (height-cropH)/2;
        NSMutableData *field = [NSMutableData dataWithLength:cropW*cropH*sizeof(float)];
        float *out = field.mutableBytes;
        float low = INFINITY, high = -INFINITY;
        if (CVPixelBufferLockBaseAddress(buffer, kCVPixelBufferLock_ReadOnly) != kCVReturnSuccess) return 1;
        const uint8_t *pixels = CVPixelBufferGetBaseAddress(buffer);
        size_t stride = CVPixelBufferGetBytesPerRow(buffer);
        for (size_t y=0; y<cropH; y++) {
            const uint8_t *row = pixels+(y+y0)*stride;
            for (size_t x=0; x<cropW; x++) {
                size_t sx=x+x0;
                float depth = format == kCVPixelFormatType_OneComponent16Half ? (float)((const _Float16 *)row)[sx]
                    : format == kCVPixelFormatType_OneComponent32Float ? ((const float *)row)[sx] : row[sx];
                out[y*cropW+x]=depth;
                if (isfinite(depth)) { low=fminf(low,depth); high=fmaxf(high,depth); }
            }
        }
        CVPixelBufferUnlockBaseAddress(buffer,kCVPixelBufferLock_ReadOnly);
        if (!(high>low)) { fputs("No usable relative depth returned\n",stderr); return 1; }
        NSMutableData *bytes=[NSMutableData dataWithLength:cropW*cropH];
        uint8_t *grayscale=bytes.mutableBytes;
        for(size_t i=0;i<cropW*cropH;i++)
            grayscale[i]=isfinite(out[i])?(uint8_t)lroundf(255*(out[i]-low)/(high-low)):0;
        CGColorSpaceRef gray=CGColorSpaceCreateDeviceGray();
        CGDataProviderRef provider=CGDataProviderCreateWithCFData((__bridge CFDataRef)bytes);
        CGImageRef map=CGImageCreate(cropW,cropH,8,8,cropW,gray,(CGBitmapInfo)kCGImageAlphaNone,provider,NULL,false,kCGRenderingIntentDefault);
        CGImageDestinationRef png=CGImageDestinationCreateWithURL((__bridge CFURLRef)[NSURL fileURLWithPath:@(argv[3])],CFSTR("public.png"),1,NULL);
        BOOL ok=NO;
        if(map&&png){CGImageDestinationAddImage(png,map,NULL);ok=CGImageDestinationFinalize(png);}
        if(png)CFRelease(png);
        if(map)CGImageRelease(map);
        CGDataProviderRelease(provider);
        CGColorSpaceRelease(gray);
        fprintf(stderr, "Relative depth %zux%zu (input %ldx%ld), range %.3f to %.3f\n",cropW,cropH,(long)size.pixelsWide,(long)size.pixelsHigh,low,high);
        return ok?0:1;
    }
}
