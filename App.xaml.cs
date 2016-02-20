using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Windows;

namespace ZNS.EliteCube
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private Process _ProcessNodeJs = null;
        private static string EDDB_TEMP_PATH;

        protected override void OnStartup(StartupEventArgs e)
        {
            var directory = System.AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            EDDB_TEMP_PATH = directory + @"\data\eddb\systems.json.tmp";

            //Start node, hidden
            ProcessStartInfo nodejs = new ProcessStartInfo();
            nodejs.FileName = directory + @"\node.exe";
            nodejs.WorkingDirectory = directory;
            nodejs.Arguments = "\"" + directory + @"\app\index.js""";
            //nodejs.RedirectStandardOutput = true;
            //nodejs.RedirectStandardError = true;
            //nodejs.UseShellExecute = false;
            //nodejs.CreateNoWindow = true;

            _ProcessNodeJs = new Process();
            _ProcessNodeJs.StartInfo = nodejs;
            //_ProcessNodeJs.EnableRaisingEvents = true;
            _ProcessNodeJs.Start();

            //Read config
            bool serverOnly = false;
            string eddb_systems_url = "https://eddb.io/archive/v4/systems.json";
            int port = 8000;
            try {
                if (File.Exists(directory + @"\config.js"))
                {
                    using (StreamReader sr = new StreamReader(directory + @"\config.js"))
                    {
                        string line;
                        while ((line = sr.ReadLine()) != null)
                        {
                            var kv = line.Trim().TrimEnd(';').Split('=');
                            if (kv[0].Trim() == "config.server_only")
                            {
                                serverOnly = bool.Parse(kv[1].Trim());
                            }
                            else if (kv[0].Trim() == "config.eddb_systems_url")
                            {
                                eddb_systems_url = kv[1].Trim().Trim('\'');
                            }
                            else if (kv[0].Trim() == "config.nodejs_port")
                            {
                                port = int.Parse(kv[1].Trim());
                            }
                        }
                    }
                }
            }
            catch
            {
                //Log
            }

            //Run browser
            if (serverOnly)
            {
                var server = new Server(port);
                server.Show();
            }
            else
            {
                var main = new MainWindow(port);
                main.Show();
            }

            //Update EDDB data
            try
            {
                var updated_eddb = true;
                var eddb_path = EDDB_TEMP_PATH.Replace(".tmp", "");
                if (File.Exists(eddb_path))
                {
                    var info = new FileInfo(eddb_path);
                    if (info.CreationTime >= DateTime.Now.AddHours(-24))
                    {
                        updated_eddb = false;
                    }
                }

                if (updated_eddb)
                {
                    using (WebClient client = new WebClient())
                    {
                        client.DownloadFileCompleted += Client_DownloadFileCompleted;
                        client.DownloadFileAsync(new Uri(eddb_systems_url), EDDB_TEMP_PATH);
                    }
                }
            }
            catch
            {
                //Log
            }

            base.OnStartup(e);
        }

        private void Client_DownloadFileCompleted(object sender, System.ComponentModel.AsyncCompletedEventArgs e)
        {
            if (!e.Cancelled && e.Error == null && File.Exists(EDDB_TEMP_PATH))
            {
                var eddb_path = EDDB_TEMP_PATH.Replace(".tmp", "");
                try
                {
                    File.Replace(EDDB_TEMP_PATH, eddb_path, eddb_path + ".bak", true);
                }
                catch {
                    //Log
                }
            }
        }

        protected override void OnExit(ExitEventArgs e)
        {
            if (_ProcessNodeJs != null && !_ProcessNodeJs.HasExited)
            {
                _ProcessNodeJs.Kill();
            }
            base.OnExit(e);
        }
    }
}
