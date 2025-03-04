import React from "react";
import { Link } from "react-router-dom";

function Navbar({ user }) {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        {user?.is_super_admin && (
          <li>
            <Link to="/super-admin">Super Admin</Link>
          </li>
        )}
        {user?.is_admin && (
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        )}
        {user?.is_user && (
          <li>
            <Link to="/user">User</Link>
          </li>
        )}
        <li>
          {user ? (
            <button onClick={() => setUser(null)}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;