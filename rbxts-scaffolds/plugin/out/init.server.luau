-- Compiled with roblox-ts v3.0.0
local toolbar = plugin:CreateToolbar("MyToolbar")
local button = toolbar:CreateButton("MyButton", "", "")
button.Click:Connect(function()
	print("Button clicked!")
end)
