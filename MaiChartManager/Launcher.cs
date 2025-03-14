using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using System.Text.RegularExpressions;
using Windows.ApplicationModel;
using Windows.ApplicationModel.Activation;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.VisualBasic;

namespace MaiChartManager;

public partial class Launcher : Form
{
    public Launcher()
    {
        InitializeComponent();
        label3.Text = $@"v{Application.ProductVersion}";
# if CRACK
        label3.Text += " This version is not for circulation";
# endif
        checkBox1.Checked = StaticSettings.Config.Export;
        textBox1.Text = StaticSettings.Config.GamePath;
        checkBoxLanAuth.Checked = StaticSettings.Config.UseAuth;
        textBoxLanAuthUser.Text = StaticSettings.Config.AuthUsername;
        textBoxLanAuthPass.Text = StaticSettings.Config.AuthPassword;
        CheckStartupStatus();
# if DEBUG
        checkBox1.Checked = true;
        StaticSettings.Config.Export = true;
        textBox1.Text = @"E:\Maimai HDD\Package";
        StartClicked(null, null);
        notifyIcon1.Visible = true;
        WindowState = FormWindowState.Minimized;
# endif
        if (!isFromStartup())
        {
            Visible = true;
            IapManager.BindToForm(this);
            return;
        }

        // Start automatically on system boot
        Visible = false;
        notifyIcon1.Visible = true;
        checkBox1.Checked = true;
        StaticSettings.Config.Export = true;
        StartClicked(null, null);
    }

    private bool isFromStartup()
    {
        try
        {
            var aeArgs = AppInstance.GetActivatedEventArgs();
            return aeArgs?.Kind == ActivationKind.StartupTask;
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            SentrySdk.CaptureException(e);
        }

        return false;
    }

    private async Task CheckStartupStatus()
    {
        var startupTask = await StartupTask.GetAsync("MaiChartManagerStartupId");
        switch (startupTask.State)
        {
            case StartupTaskState.Disabled:
                checkBox_startup.Checked = false;
                break;
            case StartupTaskState.Enabled:
                checkBox_startup.Checked = true;
                break;
            case StartupTaskState.DisabledByUser:
            case StartupTaskState.DisabledByPolicy:
                checkBox_startup.Enabled = false;
                checkBox_startup.Checked = false;
                break;
            case StartupTaskState.EnabledByPolicy: // ??
                checkBox_startup.Enabled = false;
                checkBox_startup.Checked = true;
                break;
        }
    }

    private void button1_Click(object sender, EventArgs e)
    {
        var result = folderBrowserDialog1.ShowDialog();
        if (result != DialogResult.OK) return;
        textBox1.Text = folderBrowserDialog1.SelectedPath;
    }

    private string loopbackUrl;


    [GeneratedRegex(@"[^\u0000-\u007F]")]
    private static partial Regex SpecialCharactersRegex();

    private static bool ContainsSpecialCharacters(string input)
    {
        return SpecialCharactersRegex().IsMatch(input);
    }

    private void StartClicked(object sender, EventArgs e)
    {
        if (button2.Text == "Stop")
        {
            button2.Text = "Start";
            textBox1.Enabled = true;
            button1.Enabled = true;
            checkBox1.Enabled = true;
            checkBoxLanAuth.Enabled = true;
            textBoxLanAuthUser.Enabled = true;
            textBoxLanAuthPass.Enabled = true;
            label1.Text = "";
            ServerManager.StopAsync();
            return;
        }

        if (string.IsNullOrWhiteSpace(textBox1.Text)) return;
        if (!Path.Exists(textBox1.Text))
        {
            MessageBox.Show("The selected path does not exist!");
            return;
        }

        StaticSettings.GamePath = textBox1.Text;
        if (ContainsSpecialCharacters(StaticSettings.GamePath))
        {
            MessageBox.Show("Warning: The path contains special characters or Chinese, which may cause compatibility issues with tools like MelonLoader. Please move the directory to an English path!", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        if (!Path.Exists(StaticSettings.StreamingAssets))
        {
            MessageBox.Show("It appears the selected path does not contain game files. Please select the folder where Sinmai.exe is located.");
            return;
        }

        if (!checkBox1.Checked && checkBox_startup.Checked)
        {
            checkBox_startup.Checked = false;
            checkBox_startup_Click(null, null);
        }

# if !DEBUG
        StaticSettings.Config.GamePath = textBox1.Text;
        StaticSettings.Config.UseAuth = checkBoxLanAuth.Checked;
        StaticSettings.Config.AuthUsername = textBoxLanAuthUser.Text;
        StaticSettings.Config.AuthPassword = textBoxLanAuthPass.Text;
        File.WriteAllText(Path.Combine(StaticSettings.appData, "config.json"), JsonSerializer.Serialize(StaticSettings.Config));
# endif

        textBox1.Enabled = false;
        button1.Enabled = false;
        checkBox1.Enabled = false;
        checkBoxLanAuth.Enabled = false;
        textBoxLanAuthUser.Enabled = false;
        textBoxLanAuthPass.Enabled = false;
        button2.Text = "Stop";

        ServerManager.StartApp(checkBox1.Checked, () =>
        {
            var server = ServerManager.app!.Services.GetRequiredService<IServer>();
            var serverAddressesFeature = server.Features.Get<IServerAddressesFeature>();

            if (serverAddressesFeature == null) return;

            loopbackUrl = serverAddressesFeature.Addresses.First();

            // Local mode
            if (checkBox1.Checked) return;
            Invoke(() => label1_LinkClicked(null, null));
            Dispose();
        });

        if (!checkBox1.Checked) return;
        var localIp = Dns.GetHostAddresses(Dns.GetHostName()).First(it => it.AddressFamily == AddressFamily.InterNetwork);
        label1.Text = $@"https://{localIp}:5001";
    }

    private void button4_Click(object sender, EventArgs e)
    {
        Application.Exit();
    }

    private void label1_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        if (AppMain.BrowserWin is null || AppMain.BrowserWin.IsDisposed)
        {
            AppMain.BrowserWin = new Browser(loopbackUrl);
            AppMain.BrowserWin.Show();
        }
        else
        {
            AppMain.BrowserWin.Activate();
        }
    }

    private void Launcher_FormClosed(object sender, FormClosedEventArgs e)
    {
        Application.Exit();
    }

    private void checkBox1_CheckedChanged(object sender, EventArgs e)
    {
        StaticSettings.Config.Export = checkBox1.Checked;
        checkBox_startup.Visible = checkBox1.Checked;
        checkBoxLanAuth.Visible = checkBox1.Checked;
        if (!checkBox1.Checked)
        {
            checkBoxLanAuth.Checked = false;
        }
    }

    private async void checkBox_startup_Click(object sender, EventArgs e)
    {
        await SaveConfigFileAsync();
        var startupTask = await StartupTask.GetAsync("MaiChartManagerStartupId");
        if (checkBox_startup.Checked)
        {
            await startupTask.RequestEnableAsync();
        }
        else
        {
            startupTask.Disable();
        }
    }

    public void ShowWindow(object sender = null, EventArgs e = null)
    {
        Visible = true;
        WindowState = FormWindowState.Normal;
        notifyIcon1.Visible = false;
        Show();
        Focus();
    }

    private static async Task SaveConfigFileAsync()
    {
        await File.WriteAllTextAsync(Path.Combine(StaticSettings.appData, "config.json"), JsonSerializer.Serialize(StaticSettings.Config));
    }

    private async void label3_Click(object sender, EventArgs e)
    {
        if ((ModifierKeys & Keys.Shift) != Keys.Shift) return;
        if (IapManager.License == IapManager.LicenseStatus.Active) return;

        var input = Interaction.InputBox("Please enter the activation code", "Offline Activation");
        if (string.IsNullOrWhiteSpace(input)) return;

        var verify = await OfflineReg.VerifyAsync(input);
        if (!verify.IsValid)
        {
            MessageBox.Show("Invalid activation code");
            return;
        }

        MessageBox.Show("Sponsor version features have been activated, thank you");

        StaticSettings.Config.OfflineKey = input;
        await SaveConfigFileAsync();
        await IapManager.Init();
    }

    private void checkBoxLanAuth_CheckedChanged(object sender, EventArgs e)
    {
        textBoxLanAuthUser.Visible = checkBoxLanAuth.Checked;
        textBoxLanAuthPass.Visible = checkBoxLanAuth.Checked;
    }
}