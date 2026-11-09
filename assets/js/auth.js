window.NgajiAuth={
 async login(loginName,password){const{data,error}=await NgajiDB.rpc('login',{p_login_name:loginName,p_password:password});if(error)throw error;const s=data?.[0];if(!s)throw new Error('Login gagal');sessionStorage.setItem('ngaji_session',s.session_token);sessionStorage.setItem('ngaji_role',s.role);sessionStorage.setItem('ngaji_name',s.display_name||'');sessionStorage.setItem('ngaji_must_change',String(!!s.must_change_password));return s},
 async changePassword(oldPassword,newPassword){const token=this.token();const{data,error}=await NgajiDB.rpc('change_password',{p_session_token:token,p_old_password:oldPassword,p_new_password:newPassword});if(error)throw error;if(!data)throw new Error('Tidak berjaya');sessionStorage.setItem('ngaji_must_change','false');return true},
 async data(){const{data,error}=await NgajiDB.rpc('portal_data',{p_session_token:this.token()});if(error)throw error;return data},
 logout(){const t=this.token();if(t)NgajiDB.rpc('logout',{p_session_token:t}).catch(()=>{});sessionStorage.clear();location.href='login.html'},
 token(){return sessionStorage.getItem('ngaji_session')},role(){return sessionStorage.getItem('ngaji_role')}
};
