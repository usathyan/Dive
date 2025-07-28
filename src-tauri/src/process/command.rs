use std::{
    ffi::OsStr,
    fmt::{Debug, Display},
    ops::{Deref, DerefMut},
};

pub struct Command {
    inner: tokio::process::Command,
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
            let mut cmd = tokio::process::Command::new(cmd);
            // CREATE_NO_WINDOW flag to prevent console window from appearing
            cmd.creation_flags(0x08000000);
            cmd.kill_on_drop(true);
            Self { inner: cmd }
        }
    }

    #[cfg(not(target_os = "windows"))]
    pub fn new(cmd: impl AsRef<OsStr>) -> Self {
        let mut cmd = tokio::process::Command::new(cmd);
        cmd.kill_on_drop(true);

        unsafe {
            cmd.pre_exec(|| {
                libc::setpgid(0, 0);
                Ok(())
            });
        }

        Self { inner: cmd }
    }
}

impl Deref for Command {
    type Target = tokio::process::Command;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for Command {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}
