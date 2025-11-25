import { NextResponse } from 'next/server'
import userService from '../../../../services/userService'
import authService from '../../../../services/authService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ message: 'email and password required' }, { status: 400 })
    }

    const user = await userService.comparePassword(email, password)
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    // hide password
    // @ts-ignore
    if (user.password) delete user.password

    // sign token
    const token = authService.signToken({ userId: user.id, role: user.role })

    return NextResponse.json({ user, token }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal error' }, { status: 500 })
  }
}
