using System.Net;
using System.Net.Sockets;
using System.Windows;

namespace ZNS.EliteCube
{
    /// <summary>
    /// Interaction logic for Server.xaml
    /// </summary>
    public partial class Server : Window
    {
        public class TextBoxText
        {
            public string Text { get; set; }
        }

        public Server()
        {
            InitializeComponent();

            //Get local ip
            string strIP = null;
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork)
                {
                    strIP = ip.ToString();
                }
            }

            textBlock.DataContext = new TextBoxText {
                Text = "Server is running. Open http://" + (strIP ?? "localhost") + ":8000 in your browser. Preferably Chrome. Close this window to stop server."
            };

            System.Diagnostics.Process.Start("http://localhost:8000");
        }
    }
}
