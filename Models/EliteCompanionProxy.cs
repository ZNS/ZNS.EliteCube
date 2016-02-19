using System.Threading.Tasks;
using ZNS.EliteCompanionAPI;

namespace ZNS.EliteCube.Models
{
    public class EliteCompanionProxy
    {
        public async Task<object> LoadProfile(string email)
        {
            var success = EliteCompanion.Instance.LoadProfile(email);
            return new { status = success ? "ok" : "notok" };
        }

        public async Task<object> CreateProfile(dynamic arg)
        {
            EliteCompanion.Instance.CreateProfile((string)arg.email, (string)arg.password);
            return new { status = "Ok" };
        }

        public async Task<object> Login(dynamic arg)
        {
            return await EliteCompanion.Instance.Login();
        }

        public async Task<object> SubmitVerification(string code)
        {
            return await EliteCompanion.Instance.SubmitVerification(code);
        }

        public async Task<object> GetProfileData(dynamic arg)
        {
            var force = bool.Parse((string)arg.force);
            return await EliteCompanion.Instance.GetProfileData(force);
        }
    }
}
