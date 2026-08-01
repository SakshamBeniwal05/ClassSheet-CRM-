import { useForm } from "react-hook-form"
import { userStore } from "../../../store/userStore"
import SubSelectToggleDemo from "../../../components/ui/sub-select-toggle/demo"

type LoginForm = {
    email: string
    password: string
}

const Login = () => {
    const { register, handleSubmit } = useForm<LoginForm>()
    const { isLoggingIn, login } = userStore()

    return (
        <div>
            <div >
                <div></div>
                {/* login form */}
                <div>
                    <SubSelectToggleDemo />
                    <form onSubmit={handleSubmit(login)}>
                        <div>
                            <label htmlFor="email-input">
                                EMAIL ADDRESS
                            </label>
                            <input id="email-input" type="text" {...register("email")} />
                        </div>
                        <div>
                            <label htmlFor="password-input">
                                PASSWORD
                            </label>
                            <input id="password-input" type="password" {...register("password")} />
                        </div>
                        <div>
                            <button type="submit" disabled={isLoggingIn}>
                                {isLoggingIn ? "LOGGING IN..." : "LOGIN"}
                            </button>
                        </div>
                    </form>
                </div>
                {/* login form */}

                <div></div>
            </div>
            <div></div>
        </div>
    )
}



export default Login