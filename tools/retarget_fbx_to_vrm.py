"""
retarget_fbx_to_vrm.py — Blender script để retarget Mixamo FBX animations sang VRM.

CÁCH DÙNG:
  blender --background --python retarget_fbx_to_vrm.py -- \
    --vrm "D:/assets_raw/avatar/647887956803937611.vrm" \
    --fbx_dir "D:/assets_raw/anim/" \
    --out_dir "apps/web/public/animations/"

HOẶC mở Blender → Scripting tab → paste và chạy.

YÊU CẦU:
  - Blender 3.6+ với VRM addon (https://vrm-addon-for-blender.info/)
  - File VRM và FBX đã có sẵn
"""

import bpy
import os
import sys
import argparse

# Mixamo bone → VRM humanoid bone name mapping
MIXAMO_TO_VRM = {
    "mixamorig:Hips":             "J_Bip_C_Hips",
    "mixamorig:Spine":            "J_Bip_C_Spine",
    "mixamorig:Spine1":           "J_Bip_C_Chest",
    "mixamorig:Spine2":           "J_Bip_C_UpperChest",
    "mixamorig:Neck":             "J_Bip_C_Neck",
    "mixamorig:Head":             "J_Bip_C_Head",
    "mixamorig:LeftShoulder":     "J_Bip_L_Shoulder",
    "mixamorig:LeftArm":          "J_Bip_L_UpperArm",
    "mixamorig:LeftForeArm":      "J_Bip_L_LowerArm",
    "mixamorig:LeftHand":         "J_Bip_L_Hand",
    "mixamorig:RightShoulder":    "J_Bip_R_Shoulder",
    "mixamorig:RightArm":         "J_Bip_R_UpperArm",
    "mixamorig:RightForeArm":     "J_Bip_R_LowerArm",
    "mixamorig:RightHand":        "J_Bip_R_Hand",
    "mixamorig:LeftUpLeg":        "J_Bip_L_UpperLeg",
    "mixamorig:LeftLeg":          "J_Bip_L_LowerLeg",
    "mixamorig:LeftFoot":         "J_Bip_L_Foot",
    "mixamorig:LeftToeBase":      "J_Bip_L_ToeBase",
    "mixamorig:RightUpLeg":       "J_Bip_R_UpperLeg",
    "mixamorig:RightLeg":         "J_Bip_R_LowerLeg",
    "mixamorig:RightFoot":        "J_Bip_R_Foot",
    "mixamorig:RightToeBase":     "J_Bip_R_ToeBase",
}

# FBX file → output name mapping
FBX_FILES = {
    "Breathing Idle.fbx":   "idle",
    "Fast Run.fbx":         "run",
    "Jumping.fbx":          "jump",
    "Waving Gesture.fbx":   "wave",
    "Walking Turn 180.fbx": "walk",
    "Sitting Idle.fbx":     "sit",
}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_vrm(vrm_path: str):
    """Import VRM file và trả về armature object."""
    bpy.ops.import_scene.vrm(filepath=vrm_path)
    for obj in bpy.context.scene.objects:
        if obj.type == "ARMATURE":
            return obj
    raise RuntimeError("Không tìm thấy armature trong VRM")


def import_fbx_animation(fbx_path: str):
    """Import FBX và trả về action đầu tiên."""
    bpy.ops.import_scene.fbx(
        filepath=fbx_path,
        use_anim=True,
        automatic_bone_orientation=True,
    )
    # Lấy action vừa import
    if bpy.data.actions:
        return bpy.data.actions[-1]
    return None


def retarget_action(fbx_action, vrm_armature):
    """
    Tạo action mới với bone names của VRM từ action Mixamo.
    """
    new_action = bpy.data.actions.new(name=fbx_action.name + "_retargeted")

    for fcurve in fbx_action.fcurves:
        # data_path format: 'pose.bones["mixamorig:Hips"].rotation_quaternion'
        data_path = fcurve.data_path
        if 'pose.bones["' not in data_path:
            continue

        start = data_path.index('["') + 2
        end = data_path.index('"]')
        mixamo_bone = data_path[start:end]
        vrm_bone = MIXAMO_TO_VRM.get(mixamo_bone)

        if not vrm_bone:
            continue

        # Kiểm tra bone tồn tại trong VRM armature
        if vrm_bone not in vrm_armature.data.bones:
            continue

        new_path = data_path.replace(f'"{mixamo_bone}"', f'"{vrm_bone}"')
        new_fc = new_action.fcurves.new(
            data_path=new_path,
            index=fcurve.array_index,
        )
        new_fc.keyframe_points.add(len(fcurve.keyframe_points))
        for i, kp in enumerate(fcurve.keyframe_points):
            new_fc.keyframe_points[i].co = kp.co
            new_fc.keyframe_points[i].interpolation = kp.interpolation

    return new_action


def export_glb(vrm_armature, action, out_path: str):
    """Export armature + action ra GLB."""
    # Assign action
    if vrm_armature.animation_data is None:
        vrm_armature.animation_data_create()
    vrm_armature.animation_data.action = action

    # Select chỉ armature
    bpy.ops.object.select_all(action="DESELECT")
    vrm_armature.select_set(True)
    bpy.context.view_layer.objects.active = vrm_armature

    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_animations=True,
        export_selected=True,
        export_apply=True,
    )
    print(f"[retarget] Exported: {out_path}")


def main():
    # Parse args sau "--"
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--vrm", required=True)
    parser.add_argument("--fbx_dir", required=True)
    parser.add_argument("--out_dir", required=True)
    args = parser.parse_args(argv)

    os.makedirs(args.out_dir, exist_ok=True)

    for fbx_file, out_name in FBX_FILES.items():
        fbx_path = os.path.join(args.fbx_dir, fbx_file)
        if not os.path.exists(fbx_path):
            print(f"[retarget] Bỏ qua (không tìm thấy): {fbx_path}")
            continue

        print(f"\n[retarget] Xử lý: {fbx_file} → {out_name}.glb")
        clear_scene()

        vrm_arm = import_vrm(args.vrm)
        fbx_action = import_fbx_animation(fbx_path)

        if not fbx_action:
            print(f"[retarget] Không có animation trong {fbx_file}")
            continue

        retargeted = retarget_action(fbx_action, vrm_arm)
        out_path = os.path.join(args.out_dir, f"{out_name}.glb")
        export_glb(vrm_arm, retargeted, out_path)

    print("\n[retarget] Hoàn thành!")


if __name__ == "__main__":
    main()
