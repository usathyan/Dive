use std::{
    ffi::OsStr,
    fmt::{Debug, Display},
    ops::{Deref, DerefMut},
};

pub struct Command {
    inner: std::process::Command,
}

impl Display for Command {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Command {{ inner: {:?} }}", self.inner)
    }
}

impl Debug for Command {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Command {{ inner: {:?} }}", self.inner)
    }
}

impl Command {
    #[cfg(target_os = "windows")]
    pub fn new(cmd: impl AsRef<OsStr>) -> Self {
        {
            use std::os::windows::process::CommandExt;

            let mut cmd = std::process::Command::new(cmd);
            // CREATE_NO_WINDOW flag to prevent console window from appearing
            cmd.creation_flags(0x08000000);
            Self { inner: cmd }
        }
    }

    #[cfg(not(target_os = "windows"))]
    pub fn new(cmd: impl AsRef<OsStr>) -> Self {
        use std::os::unix::process::CommandExt;

        let mut cmd = std::process::Command::new(cmd);
        unsafe {
            cmd.pre_exec(|| {
                // Set up process to be killed when parent dies (Linux only)
                #[cfg(target_os = "linux")]
                {
                    // PR_SET_PDEATHSIG: Send SIGKILL when parent dies
                    libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGKILL, 0, 0, 0);
                }

                Ok(())
            });
        }

        // set the process group to the current process
        cmd.process_group(0);

        Self { inner: cmd }
    }
}

impl Deref for Command {
    type Target = std::process::Command;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for Command {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}
