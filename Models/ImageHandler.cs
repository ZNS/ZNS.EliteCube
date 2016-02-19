using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using ImageProcessor;
using ImageProcessor.Imaging.Formats;

namespace ZNS.EliteCube.Models
{
    public class ImageHandler
    {
        public async Task<object> CopyScreenshot(dynamic param)
        {
            return await Task.Run(() => CopyScreenshotTask((string)param.imagePath, (string)param.destinationPath, (int)param.maxSize));
        }

        public object CopyScreenshotTask(string imagePath, string destinationPath, int maxSize)
        {
            var guid = Guid.NewGuid().ToString();
            var destinationPathLarge = destinationPath.TrimEnd('\\') + "\\" + guid + ".png";
            var destinationPathThumb = destinationPath.TrimEnd('\\') + "\\" + guid + "_thumb.png";
            try
            {
                if (File.Exists(imagePath))
                {
                    using (ImageFactory factory = new ImageFactory(preserveExifData: true))
                    {
                        var job = factory.Load(imagePath);
                        if (maxSize > 0) {
                            job = job.Resize(new ImageProcessor.Imaging.ResizeLayer(new Size { Width = 1920, Height = 0 }, upscale: false));
                        }
                        job
                            .Format(new PngFormat { Quality = 100 })
                            .Save(destinationPathLarge)
                            .Resize(new Size { Width = 480, Height = 0 })
                            .Save(destinationPathThumb);
                    }
                }
            }
            catch (Exception x)
            {
                return new { status = "error", error = x.Message };
            }
            return new { status = "ok", imagePath = destinationPathLarge };
        }
    }
}
