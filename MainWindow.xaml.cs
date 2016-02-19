using System.Windows;
using CefSharp;

namespace ZNS.EliteCube
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

            var settings = new CefSettings();
            settings.CefCommandLineArgs.Add("no-proxy-server", "1");
            settings.CefCommandLineArgs.Add("disable-gpu-vsync", "1");
            Cef.OnContextInitialized = delegate
            {
                var cookieManager = Cef.GetGlobalCookieManager();
                cookieManager.SetStoragePath(".\\chrome\\cookies", true);
                cookieManager.SetSupportedSchemes("http");
            };

            Cef.Initialize(settings, true, false); //This always returns false, but seems to work anyway...?
            var browser = new CefSharp.Wpf.ChromiumWebBrowser();
            mainGrid.Children.Add(browser);
            browser.Address = "http://localhost:8000";
        }
    }
}
